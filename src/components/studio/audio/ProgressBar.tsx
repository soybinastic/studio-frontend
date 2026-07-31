import { formatBackgroundMusicDuration } from '@/lib/backgroundMusic'
import type { BackgroundMusicPlaybackState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  positionMs: number
  durationMs: number
  playbackState: BackgroundMusicPlaybackState
  className?: string
}

function progressPercent(positionMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0
  return Math.max(0, Math.min(100, (positionMs / durationMs) * 100))
}

function isIndeterminate(state: BackgroundMusicPlaybackState): boolean {
  return state === 'loading' || state === 'buffering' || state === 'uploading'
}

export function ProgressBar({
  positionMs,
  durationMs,
  playbackState,
  className,
}: ProgressBarProps) {
  const percent = progressPercent(positionMs, durationMs)
  const indeterminate = isIndeterminate(playbackState)

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className="relative h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={durationMs > 0 ? durationMs : 100}
        aria-valuenow={positionMs}
        aria-label="Playback progress"
      >
        {indeterminate ? (
          <span className="absolute inset-y-0 w-1/3 animate-pulse rounded-full bg-primary/70" />
        ) : (
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300 ease-linear"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{formatBackgroundMusicDuration(positionMs)}</span>
        <span>{durationMs > 0 ? formatBackgroundMusicDuration(durationMs) : '--:--'}</span>
      </div>
    </div>
  )
}
