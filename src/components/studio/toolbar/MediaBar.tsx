import { Mic, MicOff, Settings, Video, VideoOff, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MediaBarProps {
  micEnabled: boolean
  webcamEnabled: boolean
  onToggleMic: () => void
  onToggleWebcam: () => void
  onLeave: () => void
  onDeviceSettings?: () => void
  leaveLabel?: string
  className?: string
}

export function MediaBar({
  micEnabled,
  webcamEnabled,
  onToggleMic,
  onToggleWebcam,
  onLeave,
  onDeviceSettings,
  leaveLabel = 'Leave',
  className,
}: MediaBarProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-3', className)}>
      <Button
        variant={micEnabled ? 'secondary' : 'destructive'}
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onToggleMic}
        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>

      <Button
        variant={webcamEnabled ? 'secondary' : 'destructive'}
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onToggleWebcam}
        aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {webcamEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>

      {onDeviceSettings && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={onDeviceSettings}
          aria-label="Device settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="destructive"
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onLeave}
        aria-label={leaveLabel}
      >
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  )
}
