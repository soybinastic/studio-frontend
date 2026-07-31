import { useEffect } from 'react'
import { Camera, Mic, MicOff, Speaker, Video, VideoOff, Volume2 } from 'lucide-react'
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
import type { DeviceStore } from '@/hooks/useDeviceStore'

interface DeviceSetupModalProps {
  deviceStore: DeviceStore
  onConfirm: () => void
  open: boolean
}

export function DeviceSetupModal({ deviceStore, onConfirm, open }: DeviceSetupModalProps) {
  const {
    cameras,
    microphones,
    speakers,
    selection,
    setSelection,
    previewStream,
    startPreview,
    audioLevel,
    micMuted,
    setMicMuted,
    cameraEnabled,
    setCameraEnabled,
    testSpeaker,
    isEnumerating,
  } = deviceStore

  const handleCameraChange = (cameraId: string) => {
    setSelection({ cameraId })
    void startPreview({ cameraId, microphoneId: selection.microphoneId ?? undefined })
  }

  const handleMicChange = (microphoneId: string) => {
    setSelection({ microphoneId })
    void startPreview({ cameraId: selection.cameraId ?? undefined, microphoneId })
  }

  const handleSpeakerChange = (speakerId: string) => {
    setSelection({ speakerId })
  }

  const handleConfirm = () => {
    deviceStore.completeSetup()
    onConfirm()
  }

  useEffect(() => {
    if (!open) return

    void (async () => {
      const selection = await deviceStore.initializeDevices()
      if (selection) {
        await deviceStore.startPreview(selection)
      }
    })()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const { permissionError } = deviceStore

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel mx-4 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Set up your devices</h2>
          <p className="text-sm text-muted-foreground">
            Choose your camera, microphone, and speaker before joining the studio.
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
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                Camera
              </Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCameraEnabled(!cameraEnabled)}
                aria-label={cameraEnabled ? 'Disable camera' : 'Enable camera'}
              >
                {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
            </div>
            <CameraPreview stream={previewStream} enabled={cameraEnabled} />
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
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Mic className="h-3.5 w-3.5" />
                Microphone
              </Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMicMuted(!micMuted)}
                aria-label={micMuted ? 'Unmute' : 'Mute'}
              >
                {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <AudioMeter level={audioLevel} muted={micMuted} className="h-8" />
            <Select
              value={selection.microphoneId ?? undefined}
              onValueChange={handleMicChange}
              disabled={isEnumerating || microphones.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={microphones.length === 0 ? 'No microphones found' : 'Select microphone'} />
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

        <div className="mt-6 flex justify-end">
          <Button onClick={handleConfirm} disabled={!selection.cameraId && !selection.microphoneId}>
            Join studio
          </Button>
        </div>
      </div>
    </div>
  )
}
