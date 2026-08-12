import { Loader2, MonitorOff, MonitorPlay } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScreenSourceSettings, Source } from '@/types/sources'
import { cn } from '@/lib/utils'

interface ScreenShareControlsProps {
  source: Source
  disabled?: boolean
  onStart: (sourceId: string) => Promise<unknown>
  onStop: (sourceId: string) => Promise<unknown>
  onToggleSystemAudio?: (sourceId: string, withSystemAudio: boolean) => Promise<unknown>
  className?: string
}

export function ScreenShareControls({
  source,
  disabled = false,
  onStart,
  onStop,
  onToggleSystemAudio,
  className,
}: ScreenShareControlsProps) {
  const settings = (source.settings ?? {}) as ScreenSourceSettings
  const isLive = Boolean(settings.producerId) && source.state === 'ACTIVE'
  const withSystemAudio = Boolean(settings.withSystemAudio)

  return (
    <div
      className={cn('space-y-2 border-t border-border/40 px-2 pb-2 pt-2', className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        {isLive ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7"
            disabled={disabled}
            onClick={() => void onStop(source.id)}
          >
            <MonitorOff className="mr-1.5 h-3.5 w-3.5" />
            Stop share
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-7"
            disabled={disabled}
            onClick={() => void onStart(source.id)}
          >
            <MonitorPlay className="mr-1.5 h-3.5 w-3.5" />
            Start share
          </Button>
        )}
        {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
      </div>

      <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <input
          type="checkbox"
          className="h-3 w-3 accent-primary"
          checked={withSystemAudio}
          disabled={disabled || isLive || !onToggleSystemAudio}
          onChange={(event) => {
            void onToggleSystemAudio?.(source.id, event.target.checked)
          }}
        />
        Include tab/system audio on next start
        {isLive && withSystemAudio ? (
          <span className="text-[10px] text-foreground/70">(active)</span>
        ) : null}
      </label>
    </div>
  )
}
