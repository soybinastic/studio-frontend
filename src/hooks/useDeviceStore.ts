import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  EMPTY_DEVICE_SELECTION,
  type DeviceSelection,
  type DeviceState,
  type MediaDeviceInfo,
} from '@/types/devices'
import { mapMediaDevices } from '@/lib/devices'
import { resolveSelectionDevices, selectionFromMediaDevice } from '@/lib/resolveDevice'
import { mediaErrorMessage, openAvPreviewStream, stopMediaStream } from '@/lib/openMediaStream'

const initialState: DeviceState = {
  devices: [],
  selection: { ...EMPTY_DEVICE_SELECTION },
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
  const previewGenerationRef = useRef(0)
  const lastAudioLevelRef = useRef(0)
  const selectionRef = useRef(state.selection)
  selectionRef.current = state.selection

  const enumerateDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    const raw = await navigator.mediaDevices.enumerateDevices()
    return mapMediaDevices(
      raw.map((d) => ({
        deviceId: d.deviceId,
        label: d.label,
        kind: d.kind as MediaDeviceInfo['kind'],
        groupId: d.groupId,
      })),
    )
  }, [])

  const applyDeviceList = useCallback((devices: MediaDeviceInfo[], prevSelection?: DeviceSelection): DeviceSelection => {
    const selection = resolveSelectionDevices(devices, prevSelection ?? selectionRef.current)
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
    stopMediaStream(previewStreamRef.current)
    previewStreamRef.current = null
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
      const generation = ++previewGenerationRef.current
      stopPreview()
      stopAudioMeter()
      setPermissionError(null)

      const merged = { ...selectionRef.current, ...selection }
      const devices = state.devices.length > 0 ? state.devices : await enumerateDevices()
      if (generation !== previewGenerationRef.current) return

      const resolved = resolveSelectionDevices(devices, merged)
      selectionRef.current = resolved
      dispatch({ selection: resolved })

      if (!resolved.cameraId && !resolved.microphoneId) return

      try {
        const stream = await openAvPreviewStream({
          cameraId: resolved.cameraId,
          microphoneId: resolved.microphoneId,
        })
        if (generation !== previewGenerationRef.current) {
          stopMediaStream(stream)
          return
        }

        previewStreamRef.current = stream
        dispatch({ previewStream: stream })

        if (resolved.microphoneId && stream.getAudioTracks().length > 0) {
          const ctx = new AudioContext()
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)

          const data = new Uint8Array(analyser.frequencyBinCount)
          const tick = () => {
            if (generation !== previewGenerationRef.current) return
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
        if (generation !== previewGenerationRef.current) return
        setPermissionError(mediaErrorMessage(err, 'Could not start preview with selected devices.'))
      }
    },
    [stopPreview, stopAudioMeter, state.devices, enumerateDevices],
  )

  const setSelection = useCallback((selection: Partial<DeviceSelection>) => {
    const next = { ...selectionRef.current, ...selection }
    selectionRef.current = next
    dispatch({ selection: next })
  }, [])

  const selectCamera = useCallback(
    (deviceId: string) => {
      const device = state.devices.find((d) => d.deviceId === deviceId && d.kind === 'videoinput')
      if (!device) return
      setSelection(selectionFromMediaDevice(device, 'camera'))
    },
    [state.devices, setSelection],
  )

  const selectMicrophone = useCallback(
    (deviceId: string) => {
      const device = state.devices.find((d) => d.deviceId === deviceId && d.kind === 'audioinput')
      if (!device) return
      setSelection(selectionFromMediaDevice(device, 'microphone'))
    },
    [state.devices, setSelection],
  )

  const selectSpeaker = useCallback(
    (deviceId: string) => {
      setSelection({ speakerId: deviceId })
    },
    [setSelection],
  )

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
    selectCamera,
    selectMicrophone,
    selectSpeaker,
    startPreview,
    stopPreview,
    testSpeaker,
    completeSetup,
    setMicMuted: (micMuted: boolean) => dispatch({ micMuted }),
    setCameraEnabled: (cameraEnabled: boolean) => dispatch({ cameraEnabled }),
  }
}

export type DeviceStore = ReturnType<typeof useDeviceStore>
