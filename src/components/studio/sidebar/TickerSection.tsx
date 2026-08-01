import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TickerPicker } from '@/components/studio/sidebar/TickerPicker'
import { GraphicsCollapsibleSection } from '@/components/studio/sidebar/GraphicsCollapsibleSection'
import type { GraphicsState } from '@/types/graphics'
import { tickerShouldShow } from '@/lib/graphics'

interface TickerSectionProps {
  ticker: GraphicsState['ticker']
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear: () => void
  onCreateCustom?: () => void
}

export function TickerSection({
  ticker,
  disabled,
  onSelect,
  onClear,
  onCreateCustom,
}: TickerSectionProps) {
  const isActive = tickerShouldShow(ticker)

  return (
    <GraphicsCollapsibleSection
      title="Ticker"
      description="Use a preset or create custom scrolling text for the top or bottom of the frame."
      isActive={isActive}
      headerActions={
        onCreateCustom ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-[10px]"
            disabled={disabled}
            onClick={onCreateCustom}
          >
            <Plus className="h-3 w-3" />
            Create
          </Button>
        ) : undefined
      }
    >
      {isActive && ticker && (
        <div
          className="truncate rounded-md px-2 py-1 text-[10px]"
          style={{ backgroundColor: ticker.primary, color: ticker.secondary }}
        >
          {ticker.tickerText}
        </div>
      )}

      <TickerPicker ticker={ticker} disabled={disabled} onSelect={onSelect} onClear={onClear} />
    </GraphicsCollapsibleSection>
  )
}
