import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MediaControlsProps {
  micEnabled: boolean
  webcamEnabled: boolean
  onToggleMic: () => void
  onToggleWebcam: () => void
  onLeave: () => void
  leaveLabel?: string
  className?: string
}

export function MediaControls({
  micEnabled,
  webcamEnabled,
  onToggleMic,
  onToggleWebcam,
  onLeave,
  leaveLabel = 'Leave',
  className,
}: MediaControlsProps) {
  return (
    <div
      className={cn(
        'glass-panel flex flex-wrap items-center justify-center gap-2 rounded-2xl p-3 sm:gap-3 sm:p-4',
        className,
      )}
    >
      <Button
        variant={micEnabled ? 'secondary' : 'destructive'}
        size="lg"
        className="rounded-full"
        onClick={onToggleMic}
        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>
      <Button
        variant={webcamEnabled ? 'secondary' : 'destructive'}
        size="lg"
        className="rounded-full"
        onClick={onToggleWebcam}
        aria-label={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {webcamEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>
      <Button variant="destructive" size="lg" className="rounded-full px-6" onClick={onLeave}>
        <PhoneOff className="mr-2 h-5 w-5" />
        {leaveLabel}
      </Button>
    </div>
  )
}
