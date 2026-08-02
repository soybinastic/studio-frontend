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

export async function openVideoStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
): Promise<MediaStream> {
  const base = mode === 'producer' ? PRODUCER_VIDEO_CONSTRAINTS : PREVIEW_VIDEO_CONSTRAINTS
  const attempts: MediaStreamConstraints[] = deviceId
    ? [
        { video: { ...base, deviceId: { ideal: deviceId } } },
        { video: { deviceId: { ideal: deviceId } } },
        { video: true },
      ]
    : [{ video: base }, { video: true }]

  return openWithFallback(attempts)
}

export async function openAudioStream(
  deviceId?: string | null,
  mode: 'preview' | 'producer' = 'preview',
): Promise<MediaStream> {
  const base = mode === 'producer' ? MIC_CONSTRAINTS : PREVIEW_MIC_CONSTRAINTS
  const attempts: MediaStreamConstraints[] = deviceId
    ? [
        { audio: { ...base, deviceId: { ideal: deviceId } } },
        { audio: { deviceId: { ideal: deviceId } } },
        { audio: true },
      ]
    : [{ audio: base }, { audio: true }]

  return openWithFallback(attempts)
}

export async function openAvPreviewStream(options: {
  cameraId?: string | null
  microphoneId?: string | null
}): Promise<MediaStream> {
  const { cameraId, microphoneId } = options
  const attempts: MediaStreamConstraints[] = []

  if (cameraId && microphoneId) {
    attempts.push({
      video: { ...PREVIEW_VIDEO_CONSTRAINTS, deviceId: { ideal: cameraId } },
      audio: { ...PREVIEW_MIC_CONSTRAINTS, deviceId: { ideal: microphoneId } },
    })
    attempts.push({
      video: { deviceId: { ideal: cameraId } },
      audio: { deviceId: { ideal: microphoneId } },
    })
  } else if (cameraId) {
    attempts.push({
      video: { ...PREVIEW_VIDEO_CONSTRAINTS, deviceId: { ideal: cameraId } },
    })
    attempts.push({ video: { deviceId: { ideal: cameraId } } })
  } else if (microphoneId) {
    attempts.push({
      audio: { ...PREVIEW_MIC_CONSTRAINTS, deviceId: { ideal: microphoneId } },
    })
    attempts.push({ audio: { deviceId: { ideal: microphoneId } } })
  }

  if (cameraId && microphoneId) {
    attempts.push({ video: true, audio: true })
  } else if (cameraId) {
    attempts.push({ video: true })
  } else if (microphoneId) {
    attempts.push({ audio: true })
  }

  return openWithFallback(attempts)
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
      return 'Device is in use by another application or tab.'
    }
    if (err.name === 'OverconstrainedError') {
      return 'Selected device could not be opened with the requested settings.'
    }
  }
  return fallback
}
