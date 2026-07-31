import { Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BackgroundMusicPlaybackState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

interface PlaybackControlsProps {
  playbackState: BackgroundMusicPlaybackState
  hasTrack: boolean
  disabled?: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  className?: string
}

export function PlaybackControls({
  playbackState,
  hasTrack,
  disabled,
  onPlay,
  onPause,
  onResume,
  onStop,
  className,
}: PlaybackControlsProps) {
  const showPlay =
    hasTrack &&
    (playbackState === 'idle' ||
      playbackState === 'ready' ||
      playbackState === 'stopped' ||
      playbackState === 'error')

  const showPause = playbackState === 'playing' || playbackState === 'buffering'
  const showResume = playbackState === 'paused'
  const showStop =
    playbackState === 'playing' ||
    playbackState === 'paused' ||
    playbackState === 'buffering' ||
    playbackState === 'loading'

  if (!hasTrack) {
    return (
      <p className={cn('text-[10px] text-muted-foreground', className)}>
        Select a track to enable playback controls.
      </p>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showPlay ? (
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={onPlay}
          aria-label="Play background music"
        >
          <Play className="h-3.5 w-3.5" />
          Play
        </Button>
      ) : null}

      {showPause ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onPause}
          aria-label="Pause background music"
        >
          <Pause className="h-3.5 w-3.5" />
          Pause
        </Button>
      ) : null}

      {showResume ? (
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={onResume}
          aria-label="Resume background music"
        >
          <Play className="h-3.5 w-3.5" />
          Resume
        </Button>
      ) : null}

      {showStop ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onStop}
          aria-label="Stop background music"
        >
          <Square className="h-3.5 w-3.5" />
          Stop
        </Button>
      ) : null}
    </div>
  )
}
