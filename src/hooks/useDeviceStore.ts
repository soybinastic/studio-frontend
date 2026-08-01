import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { DeviceSelection, DeviceState, MediaDeviceInfo } from '@/types/devices'

const initialState: DeviceState = {
  devices: [],
  selection: { cameraId: null, microphoneId: null, speakerId: null },
  isEnumerating: false,
  isSetupComplete: false,
  micMuted: false,
  cameraEnabled: true,
  previewStream: null,
  audioLevel: 0,
}

function deviceReducer(state: DeviceState, action: Partial<DeviceState>): DeviceState {
  return { ...state, ...action }
}

function mapDevices(raw: MediaDeviceInfo[]): MediaDeviceInfo[] {
  return raw
    .filter((d) => d.deviceId !== '')
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `${d.kind.replace('input', '').replace('output', '')} (${d.deviceId.slice(0, 8)})`,
      kind: d.kind,
    }))
}

export function useDeviceStore() {
  const [state, dispatch] = useReducer(
    (s: DeviceState, a: Partial<DeviceState>) => deviceReducer(s, a),
    initialState,
  )
  const [permissionError, setPermissionError] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  )
  const analyserRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; raf: number } | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const lastAudioLevelRef = useRef(0)
  const selectionRef = useRef(state.selection)
  selectionRef.current = state.selection

  const enumerateDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    const raw = await navigator.mediaDevices.enumerateDevices()
    const devices = mapDevices(
      raw.map((d) => ({
        deviceId: d.deviceId,
        label: d.label,
        kind: d.kind as MediaDeviceInfo['kind'],
      })),
    )
    return devices
  }, [])

  const applyDeviceList = useCallback((devices: MediaDeviceInfo[], prevSelection?: DeviceSelection): DeviceSelection => {
    const sel = prevSelection ?? selectionRef.current
    const cameras = devices.filter((d) => d.kind === 'videoinput')
    const mics = devices.filter((d) => d.kind === 'audioinput')
    const speakers = devices.filter((d) => d.kind === 'audiooutput')

    const selection: DeviceSelection = {
      cameraId: sel.cameraId && cameras.some((d) => d.deviceId === sel.cameraId)
        ? sel.cameraId
        : cameras[0]?.deviceId ?? null,
      microphoneId: sel.microphoneId && mics.some((d) => d.deviceId === sel.microphoneId)
        ? sel.microphoneId
        : mics[0]?.deviceId ?? null,
      speakerId: sel.speakerId && speakers.some((d) => d.deviceId === sel.speakerId)
        ? sel.speakerId
        : speakers[0]?.deviceId ?? null,
    }

    selectionRef.current = selection
    dispatch({ devices, selection })
    return selection
  }, [])

  /**
   * Request camera/mic permission first, then enumerate.
   * Browsers hide device IDs and labels until getUserMedia succeeds.
   */
  const initializeDevices = useCallback(async (): Promise<DeviceSelection | null> => {
    dispatch({ isEnumerating: true })
    setPermissionError(null)

    try {
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      permissionStream.getTracks().forEach((t) => t.stop())

      const devices = await enumerateDevices()
      return applyDeviceList(devices)
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        fallbackStream.getTracks().forEach((t) => t.stop())
        const devices = await enumerateDevices()
        return applyDeviceList(devices)
      } catch {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
          fallbackStream.getTracks().forEach((t) => t.stop())
          const devices = await enumerateDevices()
          return applyDeviceList(devices)
        } catch (innerErr) {
          const msg =
            innerErr instanceof DOMException && innerErr.name === 'NotAllowedError'
              ? 'Camera and microphone access was denied. Allow permissions in your browser settings.'
              : 'Could not access media devices.'
          setPermissionError(msg)
          return null
        }
      }
    } finally {
      dispatch({ isEnumerating: false })
    }
  }, [enumerateDevices, applyDeviceList])

  const stopPreview = useCallback(() => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((t) => t.stop())
      previewStreamRef.current = null
    }
    dispatch({ previewStream: null })
  }, [])

  const stopAudioMeter = useCallback(() => {
    if (analyserRef.current) {
      cancelAnimationFrame(analyserRef.current.raf)
      void analyserRef.current.ctx.close()
      analyserRef.current = null
    }
    lastAudioLevelRef.current = 0
    dispatch({ audioLevel: 0 })
  }, [])

  const startPreview = useCallback(
    async (selection?: Partial<DeviceSelection>) => {
      stopPreview()
      stopAudioMeter()

      const cameraId = selection?.cameraId ?? selectionRef.current.cameraId
      const microphoneId = selection?.microphoneId ?? selectionRef.current.microphoneId

      const constraints: MediaStreamConstraints = {}
      if (cameraId) {
        constraints.video = {
          deviceId: { exact: cameraId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        }
      }
      if (microphoneId) {
        constraints.audio = {
          deviceId: { exact: microphoneId },
          echoCancellation: true,
          noiseSuppression: true,
        }
      }

      if (!constraints.video && !constraints.audio) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        previewStreamRef.current = stream
        dispatch({ previewStream: stream })

        if (microphoneId && stream.getAudioTracks().length > 0) {
          const ctx = new AudioContext()
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)

          const data = new Uint8Array(analyser.frequencyBinCount)
          const tick = () => {
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            const level = avg / 255
            if (Math.abs(level - lastAudioLevelRef.current) >= 0.02) {
              lastAudioLevelRef.current = level
              dispatch({ audioLevel: level })
            }
            analyserRef.current!.raf = requestAnimationFrame(tick)
          }
          analyserRef.current = { ctx, analyser, raf: requestAnimationFrame(tick) }
        }
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Could not start preview — permission denied.'
            : 'Could not start preview with selected devices.'
        setPermissionError(msg)
      }
    },
    [stopPreview, stopAudioMeter],
  )

  const setSelection = useCallback((selection: Partial<DeviceSelection>) => {
    dispatch({ selection: { ...selectionRef.current, ...selection } })
  }, [])

  const testSpeaker = useCallback(async () => {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 440
    gain.gain.value = 0.1
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.3)
    await ctx.close()
  }, [])

  const completeSetup = useCallback(() => {
    dispatch({ isSetupComplete: true })
  }, [])

  const refreshDevices = useCallback(async () => {
    dispatch({ isEnumerating: true })
    try {
      const devices = await enumerateDevices()
      applyDeviceList(devices)
    } finally {
      dispatch({ isEnumerating: false })
    }
  }, [enumerateDevices, applyDeviceList])

  useEffect(() => {
    const onDeviceChange = () => void refreshDevices()
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange)
      stopPreview()
      stopAudioMeter()
    }
  }, [refreshDevices, stopPreview, stopAudioMeter])

  return {
    ...state,
    permissionError,
    cameras: state.devices.filter((d) => d.kind === 'videoinput'),
    microphones: state.devices.filter((d) => d.kind === 'audioinput'),
    speakers: state.devices.filter((d) => d.kind === 'audiooutput'),
    initializeDevices,
    refreshDevices,
    setSelection,
    startPreview,
    stopPreview,
    testSpeaker,
    completeSetup,
    setMicMuted: (micMuted: boolean) => dispatch({ micMuted }),
    setCameraEnabled: (cameraEnabled: boolean) => dispatch({ cameraEnabled }),
  }
}

export type DeviceStore = ReturnType<typeof useDeviceStore>
