import { Eye, EyeOff, GripVertical, Mic, MicOff, Pin, User, Video, VideoOff, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StudioParticipant } from '@/types/participants'
import { cn } from '@/lib/utils'

interface ParticipantCardProps {
  participant: StudioParticipant
  onPin?: (peerId: string) => void
  onHide?: (peerId: string) => void
  onMute?: (peerId: string) => void
}

export function ParticipantCard({ participant, onPin, onHide, onMute }: ParticipantCardProps) {
  const initials = participant.displayName
    .replace(' (You)', '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border/60 p-2 transition-colors',
        participant.isSpeaking && 'border-primary/50 bg-primary/5',
        participant.isPinned && 'ring-1 ring-primary/30',
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground/50" />

      <div className="relative shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {initials || <User className="h-4 w-4" />}
        </div>
        {participant.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {participant.displayName.replace(' (You)', '')}
          </span>
          {participant.isHost && (
            <Badge variant="secondary" className="px-1 py-0 text-[9px]">Host</Badge>
          )}
          {participant.isLocal && (
            <Badge variant="outline" className="px-1 py-0 text-[9px]">You</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {participant.audioEnabled ? (
            <Mic className="h-3 w-3" />
          ) : (
            <MicOff className="h-3 w-3 text-destructive" />
          )}
          {participant.videoEnabled ? (
            <Video className="h-3 w-3" />
          ) : (
            <VideoOff className="h-3 w-3 text-destructive" />
          )}
          {participant.connectionStatus === 'connected' ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-yellow-500" />
          )}
          <span className="text-[10px]">Slot {participant.slotIndex}</span>
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5">
        {onPin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPin(participant.peerId)}
            aria-label={participant.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-3.5 w-3.5', participant.isPinned && 'fill-current text-primary')} />
          </Button>
        )}
        {onMute && participant.isLocal && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMute(participant.peerId)}>
            {participant.audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </Button>
        )}
        {onHide && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onHide(participant.peerId)}>
            {participant.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  )
}
