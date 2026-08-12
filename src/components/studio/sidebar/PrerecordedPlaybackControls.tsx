import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { VolumeSlider } from '@/components/studio/audio/VolumeSlider'
import { Button } from '@/components/ui/button'
import { usePrerecordedPlayhead } from '@/hooks/usePrerecordedPlayhead'
import { formatPlaybackClock, isPrerecordedPlaying } from '@/lib/prerecordedPlayback'
import { cn } from '@/lib/utils'
import type { Source } from '@/types/sources'

interface PrerecordedPlaybackControlsProps {
  source: Source
  disabled?: boolean
  onPlay: () => Promise<unknown>
  onPause: () => Promise<unknown>
  onSeek: (positionMs: number) => Promise<unknown>
  onVolumeChange: (volume: number) => Promise<unknown>
  onMutedChange: (muted: boolean) => Promise<unknown>
  className?: string
}

export function PrerecordedPlaybackControls({
  source,
  disabled = false,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMutedChange,
  className,
}: PrerecordedPlaybackControlsProps) {
  const { positionMs, durationMs, markSeek, markPlay, markPause } =
    usePrerecordedPlayhead(source)
  const [scrubMs, setScrubMs] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const scrubbingRef = useRef(false)

  const displayMs = scrubMs ?? positionMs
  const playing = isPrerecordedPlaying(source.state)
  const maxMs = durationMs > 0 ? durationMs : Math.max(displayMs, 1)
  const controlsDisabled = disabled || busy

  useEffect(() => {
    if (!scrubbingRef.current) {
      setScrubMs(null)
    }
  }, [positionMs])

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await action()
    } finally {
      setBusy(false)
    }
  }

  const handlePlayPause = () => {
    if (playing) {
      void run(async () => {
        markPause()
        await onPause()
      })
      return
    }
    void run(async () => {
      markPlay()
      await onPlay()
    })
  }

  const commitSeek = (ms: number) => {
    scrubbingRef.current = false
    markSeek(ms)
    setScrubMs(null)
    void run(async () => {
      await onSeek(ms)
    })
  }

  return (
    <div
      className={cn('space-y-2 border-t border-border/40 px-2 pb-2 pt-2', className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7 w-7 shrink-0"
          disabled={controlsDisabled || source.state === 'STOPPED'}
          onClick={handlePlayPause}
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>

        <div className="min-w-0 flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={maxMs}
            step={250}
            value={Math.min(displayMs, maxMs)}
            disabled={controlsDisabled || durationMs <= 0}
            onPointerDown={() => {
              scrubbingRef.current = true
            }}
            onChange={(event) => {
              scrubbingRef.current = true
              setScrubMs(Number(event.target.value))
            }}
            onPointerUp={(event) => {
              commitSeek(Number((event.target as HTMLInputElement).value))
            }}
            onKeyUp={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
                commitSeek(Number((event.target as HTMLInputElement).value))
              }
            }}
            className={cn(
              'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted',
              'accent-primary disabled:cursor-not-allowed disabled:opacity-50',
              '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
              '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary',
            )}
            aria-label="Seek video"
          />
          <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
            <span>{formatPlaybackClock(displayMs)}</span>
            <span>{durationMs > 0 ? formatPlaybackClock(durationMs) : '--:--'}</span>
          </div>
        </div>
      </div>

      <VolumeSlider
        volume={source.volume}
        muted={source.muted}
        disabled={controlsDisabled}
        onVolumeChange={(volume) => {
          void onVolumeChange(volume)
        }}
        onMutedChange={(muted) => {
          void onMutedChange(muted)
        }}
      />
    </div>
  )
}
