import { Loader2 } from 'lucide-react'
import { backgroundMusicErrorMessage, playbackStateLabel } from '@/lib/backgroundMusic'
import { Badge } from '@/components/ui/badge'
import type { BackgroundMusicPlaybackState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

interface PlaybackStatusProps {
  playbackState: BackgroundMusicPlaybackState
  pendingCommand?: string | null
  errorMessage?: string | null
  errorCode?: string | null
  className?: string
}

function statusVariant(
  state: BackgroundMusicPlaybackState,
): 'default' | 'secondary' | 'live' | 'success' | 'destructive' | 'outline' {
  switch (state) {
    case 'playing':
      return 'live'
    case 'paused':
      return 'secondary'
    case 'ready':
    case 'stopped':
      return 'outline'
    case 'error':
      return 'destructive'
    case 'loading':
    case 'buffering':
    case 'uploading':
      return 'default'
    default:
      return 'outline'
  }
}

function isLoadingState(state: BackgroundMusicPlaybackState): boolean {
  return state === 'loading' || state === 'buffering' || state === 'uploading'
}

export function PlaybackStatus({
  playbackState,
  pendingCommand,
  errorMessage,
  errorCode,
  className,
}: PlaybackStatusProps) {
  const label = pendingCommand
    ? `${playbackStateLabel(playbackState)}…`
    : playbackStateLabel(playbackState)

  const friendlyError = errorMessage
    ? backgroundMusicErrorMessage(errorCode ?? undefined, errorMessage)
    : null

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2">
        {isLoadingState(playbackState) || pendingCommand ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
        <Badge variant={statusVariant(playbackState)} className="text-[10px]">
          {label}
        </Badge>
      </div>
      {friendlyError ? (
        <p className="text-[10px] leading-snug text-destructive">{friendlyError}</p>
      ) : null}
    </div>
  )
}
