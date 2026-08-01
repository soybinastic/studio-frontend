import { Check } from 'lucide-react'
import { isSameTickerPreset, TICKER_PRESETS } from '@/lib/bannerTickerPresets'
import type { TickerGraphic } from '@/types/graphics'
import { tickerShouldShow } from '@/lib/graphics'
import { cn } from '@/lib/utils'

interface TickerPickerProps {
  ticker: TickerGraphic | null | undefined
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear?: () => void
}

export function TickerPicker({ ticker, disabled, onSelect, onClear }: TickerPickerProps) {
  const isActive = tickerShouldShow(ticker)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {TICKER_PRESETS.map((preset) => {
          const isSelected = isSameTickerPreset(ticker, preset)
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset.id)}
              className={cn(
                'relative overflow-hidden rounded-md border-2 px-3 py-2 text-left transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border/60 hover:border-primary/50',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-label={`Select ${preset.label} ticker`}
              aria-pressed={isSelected}
            >
              <div
                className="mb-1 truncate rounded px-2 py-1 text-[9px]"
                style={{
                  backgroundColor: preset.ticker.primary,
                  color: preset.ticker.secondary,
                }}
              >
                {preset.ticker.tickerText}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {preset.label}
                {preset.ticker.tickerPosition === 'top' ? ' · top' : ''}
              </span>
              {isSelected && (
                <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
              )}
            </button>
          )
        })}
      </div>

      {isActive && onClear && (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Remove ticker
        </button>
      )}
    </div>
  )
}
