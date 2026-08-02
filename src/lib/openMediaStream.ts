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

function assertTrackDeviceId(
  stream: MediaStream,
  kind: 'video' | 'audio',
  expectedDeviceId: string,
): void {
  const tracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks()
  const track = tracks[0]
  if (!track) {
    throw new DOMException(`No ${kind} track was returned.`, 'NotFoundError')
  }

  const actualDeviceId = track.getSettings().deviceId
  if (actualDeviceId && actualDeviceId !== expectedDeviceId) {
    for (const t of stream.getTracks()) {
      t.stop()
    }
    throw new DOMException(
      'Browser opened a different device than the one selected.',
      'OverconstrainedError',
    )
  }
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

export async function openVideoStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
): Promise<MediaStream> {
  const base = mode === 'producer' ? PRODUCER_VIDEO_CONSTRAINTS : PREVIEW_VIDEO_CONSTRAINTS

  if (!deviceId) {
    return openWithFallback([{ video: base }, { video: true }])
  }

  const attempts: MediaStreamConstraints[] = [
    { video: { ...base, deviceId: { ideal: deviceId } } },
    { video: { deviceId: { ideal: deviceId } } },
  ]

  const stream = await openWithFallback(attempts)
  assertTrackDeviceId(stream, 'video', deviceId)
  return stream
}

export async function openAudioStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
): Promise<MediaStream> {
  const base = mode === 'producer' ? MIC_CONSTRAINTS : PREVIEW_MIC_CONSTRAINTS

  if (!deviceId) {
    return openWithFallback([{ audio: base }, { audio: true }])
  }

  const attempts: MediaStreamConstraints[] = [
    { audio: { ...base, deviceId: { ideal: deviceId } } },
    { audio: { deviceId: { ideal: deviceId } } },
  ]

  const stream = await openWithFallback(attempts)
  assertTrackDeviceId(stream, 'audio', deviceId)
  return stream
}

export async function openAvPreviewStream(options: {
  cameraId?: string | null
  microphoneId?: string | null
}): Promise<MediaStream> {
  const { cameraId, microphoneId } = options

  if (!cameraId && !microphoneId) {
    throw new DOMException('No camera or microphone selected.', 'NotFoundError')
  }

  if (cameraId && microphoneId) {
    const combinedAttempts: MediaStreamConstraints[] = [
      {
        video: { ...PREVIEW_VIDEO_CONSTRAINTS, deviceId: { ideal: cameraId } },
        audio: { ...PREVIEW_MIC_CONSTRAINTS, deviceId: { ideal: microphoneId } },
      },
      {
        video: { deviceId: { ideal: cameraId } },
        audio: { deviceId: { ideal: microphoneId } },
      },
    ]

    try {
      const stream = await openWithFallback(combinedAttempts)
      assertTrackDeviceId(stream, 'video', cameraId)
      assertTrackDeviceId(stream, 'audio', microphoneId)
      return stream
    } catch {
      const videoStream = await openVideoStream(cameraId, 'preview')
      try {
        const audioStream = await openAudioStream(microphoneId, 'preview')
        return mergeMediaStreams(videoStream, audioStream)
      } catch (err) {
        for (const track of videoStream.getTracks()) {
          track.stop()
        }
        throw err
      }
    }
  }

  if (cameraId) {
    return openVideoStream(cameraId, 'preview')
  }

  return openAudioStream(microphoneId!, 'preview')
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
      return err.message.includes('different device')
        ? err.message
        : 'Selected device could not be opened with the requested settings.'
    }
  }
  return fallback
}
