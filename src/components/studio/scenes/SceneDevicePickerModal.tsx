import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Mic, Speaker, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AudioMeter } from '@/components/studio/device-setup/AudioMeter'
import { CameraPreview } from '@/components/studio/device-setup/CameraPreview'
import { enumerateMediaDevices, pickDefaultSelection } from '@/lib/devices'
import { mediaErrorMessage, openAvPreviewStream, stopMediaStream } from '@/lib/openMediaStream'
import { resolveSelectionDevices, selectionFromMediaDevice } from '@/lib/resolveDevice'
import { EMPTY_DEVICE_SELECTION, type DeviceSelection, type MediaDeviceInfo } from '@/types/devices'

interface SceneDevicePickerModalProps {
  open: boolean
  onConfirm: (selection: DeviceSelection) => void
  onCancel: () => void
}

export function SceneDevicePickerModal({ open, onConfirm, onCancel }: SceneDevicePickerModalProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selection, setSelection] = useState<DeviceSelection>({ ...EMPTY_DEVICE_SELECTION })
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isEnumerating, setIsEnumerating] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const previewStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; raf: number } | null>(null)
  const previewGenerationRef = useRef(0)
  const devicesRef = useRef<MediaDeviceInfo[]>([])
  devicesRef.current = devices

  const stopPreview = useCallback(() => {
    stopMediaStream(previewStreamRef.current)
    previewStreamRef.current = null
    setPreviewStream(null)
    if (analyserRef.current) {
      cancelAnimationFrame(analyserRef.current.raf)
      void analyserRef.current.ctx.close()
      analyserRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startPreview = useCallback(
    async (nextSelection: DeviceSelection, deviceList?: MediaDeviceInfo[]) => {
      const generation = ++previewGenerationRef.current
      stopPreview()
      setPermissionError(null)

      const list = deviceList ?? devicesRef.current
      const resolved = resolveSelectionDevices(list, nextSelection)
      setSelection(resolved)

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
        setPreviewStream(stream)

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
            setAudioLevel(avg / 255)
            analyserRef.current!.raf = requestAnimationFrame(tick)
          }
          analyserRef.current = { ctx, analyser, raf: requestAnimationFrame(tick) }
        }
      } catch (err) {
        if (generation !== previewGenerationRef.current) return
        setPermissionError(mediaErrorMessage(err, 'Could not start preview with selected devices.'))
      }
    },
    [stopPreview],
  )

  useEffect(() => {
    if (!open) {
      stopPreview()
      return
    }

    let cancelled = false
    setPermissionError(null)
    setIsEnumerating(true)

    void (async () => {
      try {
        const permissionStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        })
        permissionStream.getTracks().forEach((t) => t.stop())

        const list = await enumerateMediaDevices()
        if (cancelled) return

        const defaults = pickDefaultSelection(list, { ...EMPTY_DEVICE_SELECTION })
        setDevices(list)
        setSelection(defaults)
        setIsEnumerating(false)
        void startPreview(defaults, list)
      } catch {
        if (!cancelled) {
          setPermissionError('Camera and microphone access is required to pick scene devices.')
          setIsEnumerating(false)
        }
      }
    })()

    return () => {
      cancelled = true
      stopPreview()
    }
  }, [open, startPreview, stopPreview])

  const cameras = devices.filter((d) => d.kind === 'videoinput')
  const microphones = devices.filter((d) => d.kind === 'audioinput')
  const speakers = devices.filter((d) => d.kind === 'audiooutput')

  const handleCameraChange = (cameraId: string) => {
    const device = cameras.find((d) => d.deviceId === cameraId)
    if (!device) return
    const next = { ...selection, ...selectionFromMediaDevice(device, 'camera') }
    setSelection(next)
    void startPreview(next)
  }

  const handleMicChange = (microphoneId: string) => {
    const device = microphones.find((d) => d.deviceId === microphoneId)
    if (!device) return
    const next = { ...selection, ...selectionFromMediaDevice(device, 'microphone') }
    setSelection(next)
    void startPreview(next)
  }

  const handleSpeakerChange = (speakerId: string) => {
    setSelection((prev) => ({ ...prev, speakerId }))
  }

  const handleConfirm = () => {
    if (!selection.cameraId) return
    stopPreview()
    onConfirm(selection)
  }

  const handleCancel = () => {
    stopPreview()
    onCancel()
  }

  const testSpeaker = async () => {
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
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="glass-panel max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Choose devices for this scene</h2>
          <p className="text-sm text-muted-foreground">
            These devices apply only to the new scene and won&apos;t change your current live setup
            until you switch to it.
          </p>
          {permissionError && (
            <p className="mt-2 text-sm text-destructive">{permissionError}</p>
          )}
          {isEnumerating && (
            <p className="mt-2 text-sm text-muted-foreground">Detecting devices…</p>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Camera className="h-3.5 w-3.5" />
              Camera
            </Label>
            <CameraPreview stream={previewStream} enabled />
            <Select
              value={selection.cameraId ?? undefined}
              onValueChange={handleCameraChange}
              disabled={isEnumerating || cameras.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={cameras.length === 0 ? 'No cameras found' : 'Select camera'} />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Mic className="h-3.5 w-3.5" />
              Microphone
            </Label>
            <AudioMeter level={audioLevel} muted={false} className="h-8" />
            <Select
              value={selection.microphoneId ?? undefined}
              onValueChange={handleMicChange}
              disabled={isEnumerating || microphones.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={microphones.length === 0 ? 'No microphones found' : 'Select microphone'}
                />
              </SelectTrigger>
              <SelectContent>
                {microphones.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Speaker className="h-3.5 w-3.5" />
              Speaker
            </Label>
            <div className="flex gap-2">
              <Select
                value={selection.speakerId ?? undefined}
                onValueChange={handleSpeakerChange}
                disabled={isEnumerating || speakers.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={speakers.length === 0 ? 'No speakers found' : 'Select speaker'} />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map((d) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => void testSpeaker()} aria-label="Test speaker">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!selection.cameraId} className="w-full sm:w-auto">
            Save devices
          </Button>
        </div>
      </div>
    </div>
  )
}
