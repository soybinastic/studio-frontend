import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { percentToVolume, volumeToPercent } from '@/lib/backgroundMusic'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 150

interface VolumeSliderProps {
  volume: number
  muted: boolean
  disabled?: boolean
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void
  className?: string
}

export function VolumeSlider({
  volume,
  muted,
  disabled,
  onVolumeChange,
  onMutedChange,
  className,
}: VolumeSliderProps) {
  const [localPercent, setLocalPercent] = useState(() => volumeToPercent(volume))
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    setLocalPercent(volumeToPercent(volume))
  }, [volume])

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const commitVolume = (percent: number) => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      onVolumeChange(percentToVolume(percent))
      debounceRef.current = null
    }, DEBOUNCE_MS)
  }

  const handleSliderChange = (percent: number) => {
    setLocalPercent(percent)
    commitVolume(percent)
  }

  const handleMuteToggle = () => {
    onMutedChange(!muted)
  }

  const displayPercent = muted ? 0 : localPercent

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Volume
        </Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {muted ? 'Muted' : `${localPercent}%`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={disabled}
          onClick={handleMuteToggle}
          aria-label={muted ? 'Unmute background music' : 'Mute background music'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={displayPercent}
          disabled={disabled || muted}
          onChange={(event) => handleSliderChange(Number(event.target.value))}
          className={cn(
            'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted',
            'accent-primary disabled:cursor-not-allowed disabled:opacity-50',
            '[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
            '[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary',
          )}
          aria-label="Background music volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayPercent}
        />
      </div>
    </div>
  )
}

interface VolumeReadoutProps {
  volume: number
  muted: boolean
  className?: string
}

export function VolumeReadout({ volume, muted, className }: VolumeReadoutProps) {
  return (
    <p className={cn('text-[10px] text-muted-foreground', className)}>
      Volume: {muted ? 'Muted' : `${volumeToPercent(volume)}%`}
    </p>
  )
}
