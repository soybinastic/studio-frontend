const PREVIEW_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
}

const PRODUCER_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  frameRate: { ideal: 30 },
}

const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: false,
  autoGainControl: false,
  sampleRate: { ideal: 48000 },
  channelCount: { ideal: 1 },
}

const PREVIEW_MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
}

export interface OpenDeviceOptions {
  label?: string | null
}

export interface OpenAvPreviewOptions {
  cameraId?: string | null
  cameraLabel?: string | null
  microphoneId?: string | null
  microphoneLabel?: string | null
}

async function openWithFallback(
  attempts: MediaStreamConstraints[],
): Promise<MediaStream> {
  let lastError: unknown
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

function deviceDisplayName(label: string | null | undefined, kind: 'camera' | 'microphone'): string {
  if (label?.trim()) return label.trim()
  return kind === 'camera' ? 'Camera' : 'Microphone'
}

function wrongDeviceMessage(
  expectedLabel: string | null | undefined,
  actualLabel: string,
  kind: 'camera' | 'microphone',
): string {
  const expected = deviceDisplayName(expectedLabel, kind)
  const actual = actualLabel.trim() || 'another device'
  return `Could not open ${expected}. The browser opened ${actual} instead. Reset site camera permissions or choose the correct camera in Chrome's permission prompt.`
}

function assertTrackDeviceId(
  stream: MediaStream,
  kind: 'video' | 'audio',
  expectedDeviceId: string,
  expectedLabel?: string | null,
): void {
  const tracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks()
  const track = tracks[0]
  if (!track) {
    throw new DOMException(`No ${kind} track was returned.`, 'NotFoundError')
  }

  const actualDeviceId = track.getSettings().deviceId
  if (actualDeviceId && actualDeviceId !== expectedDeviceId) {
    const mediaKind = kind === 'video' ? 'camera' : 'microphone'
    for (const t of stream.getTracks()) {
      t.stop()
    }
    throw new DOMException(wrongDeviceMessage(expectedLabel, track.label, mediaKind), 'OverconstrainedError')
  }
}

function isWrongDeviceError(err: unknown): boolean {
  return err instanceof DOMException && err.message.includes('Could not open')
}

function mergeMediaStreams(...streams: MediaStream[]): MediaStream {
  const merged = new MediaStream()
  for (const stream of streams) {
    for (const track of stream.getTracks()) {
      merged.addTrack(track)
    }
  }
  return merged
}

function exactDeviceAttempts(
  kind: 'video' | 'audio',
  deviceId: string,
  base: MediaTrackConstraints,
): MediaStreamConstraints[] {
  if (kind === 'video') {
    return [{ video: { ...base, deviceId: { exact: deviceId } } }, { video: { deviceId: { exact: deviceId } } }]
  }
  return [{ audio: { ...base, deviceId: { exact: deviceId } } }, { audio: { deviceId: { exact: deviceId } } }]
}

export async function openVideoStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
  options?: OpenDeviceOptions,
): Promise<MediaStream> {
  const base = mode === 'producer' ? PRODUCER_VIDEO_CONSTRAINTS : PREVIEW_VIDEO_CONSTRAINTS

  if (!deviceId) {
    return openWithFallback([{ video: base }, { video: true }])
  }

  const stream = await openWithFallback(exactDeviceAttempts('video', deviceId, base))
  assertTrackDeviceId(stream, 'video', deviceId, options?.label)
  return stream
}

export async function openAudioStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
  options?: OpenDeviceOptions,
): Promise<MediaStream> {
  const base = mode === 'producer' ? MIC_CONSTRAINTS : PREVIEW_MIC_CONSTRAINTS

  if (!deviceId) {
    return openWithFallback([{ audio: base }, { audio: true }])
  }

  const stream = await openWithFallback(exactDeviceAttempts('audio', deviceId, base))
  assertTrackDeviceId(stream, 'audio', deviceId, options?.label)
  return stream
}

export async function openAvPreviewStream(options: OpenAvPreviewOptions): Promise<MediaStream> {
  const { cameraId, cameraLabel, microphoneId, microphoneLabel } = options

  if (!cameraId && !microphoneId) {
    throw new DOMException('No camera or microphone selected.', 'NotFoundError')
  }

  if (cameraId && microphoneId) {
    const combinedAttempts: MediaStreamConstraints[] = [
      {
        video: { ...PREVIEW_VIDEO_CONSTRAINTS, deviceId: { exact: cameraId } },
        audio: { ...PREVIEW_MIC_CONSTRAINTS, deviceId: { exact: microphoneId } },
      },
      {
        video: { deviceId: { exact: cameraId } },
        audio: { deviceId: { exact: microphoneId } },
      },
    ]

    try {
      const stream = await openWithFallback(combinedAttempts)
      assertTrackDeviceId(stream, 'video', cameraId, cameraLabel)
      assertTrackDeviceId(stream, 'audio', microphoneId, microphoneLabel)
      return stream
    } catch (err) {
      if (isWrongDeviceError(err)) throw err

      const videoStream = await openVideoStream(cameraId, 'preview', { label: cameraLabel })
      try {
        const audioStream = await openAudioStream(microphoneId, 'preview', { label: microphoneLabel })
        return mergeMediaStreams(videoStream, audioStream)
      } catch (innerErr) {
        for (const track of videoStream.getTracks()) {
          track.stop()
        }
        throw innerErr
      }
    }
  }

  if (cameraId) {
    return openVideoStream(cameraId, 'preview', { label: cameraLabel })
  }

  return openAudioStream(microphoneId!, 'preview', { label: microphoneLabel })
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export function mediaErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      return 'Permission denied — allow camera and microphone access in your browser.'
    }
    if (err.name === 'NotReadableError') {
      return 'Device is in use by another application or tab. Stop OBS or close other apps using the camera.'
    }
    if (err.name === 'OverconstrainedError') {
      if (err.message.includes('Could not open')) {
        return err.message
      }
      return 'Selected device could not be opened. It may be in use, blocked by browser site settings, or unavailable.'
    }
  }
  return fallback
}
