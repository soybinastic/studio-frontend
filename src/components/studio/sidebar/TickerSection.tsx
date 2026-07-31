import { Label } from '@/components/ui/label'
import { TickerPicker } from '@/components/studio/sidebar/TickerPicker'
import type { GraphicsState } from '@/types/graphics'

interface TickerSectionProps {
  ticker: GraphicsState['ticker']
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear: () => void
}

export function TickerSection({ ticker, disabled, onSelect, onClear }: TickerSectionProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Ticker</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a preset to scroll text across the top or bottom of the frame.
      </p>

      <TickerPicker ticker={ticker} disabled={disabled} onSelect={onSelect} onClear={onClear} />
    </div>
  )
}
