import { Disc3, Music2 } from 'lucide-react'
import { formatBackgroundMusicDuration } from '@/lib/backgroundMusic'
import type { BackgroundMusicConfig } from '@/types/scenes'
import type { BackgroundMusicRuntimeState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

interface TrackInformationProps {
  config: BackgroundMusicConfig
  runtime: BackgroundMusicRuntimeState
  className?: string
}

export function TrackInformation({ config, runtime, className }: TrackInformationProps) {
  const track = config.track
  const durationMs = runtime.duration_ms > 0 ? runtime.duration_ms : 0
  const positionMs = runtime.position_ms

  return (
    <div className={cn('flex gap-3', className)}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
        {track ? (
          <Disc3 className="h-6 w-6 text-primary/80" aria-hidden />
        ) : (
          <Music2 className="h-6 w-6 text-muted-foreground/60" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium leading-tight">
          {track?.title ?? 'No track selected'}
        </p>
        {track ? (
          <p className="truncate text-[10px] text-muted-foreground">
            {formatBackgroundMusicDuration(positionMs)} /{' '}
            {durationMs > 0 ? formatBackgroundMusicDuration(durationMs) : '--:--'}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">Choose a preset track for this scene</p>
        )}
      </div>
    </div>
  )
}
