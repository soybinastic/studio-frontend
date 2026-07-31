import type { TickerGraphic } from '@/types/graphics'
import { cn } from '@/lib/utils'

interface PreviewTickerLayerProps {
  ticker: TickerGraphic
}

export function PreviewTickerLayer({ ticker }: PreviewTickerLayerProps) {
  const durationSec = Math.max(8, 24 / (ticker.tickerSpeed || 2))

  return (
    <div
      className={cn(
        'absolute left-0 right-0 overflow-hidden py-1',
        ticker.tickerPosition === 'top' ? 'top-0' : 'bottom-0',
      )}
      style={{ backgroundColor: ticker.primary, color: ticker.secondary }}
    >
      <p
        className={cn(
          'whitespace-nowrap px-4 text-[10px]',
          ticker.tickerDirection === 'ltr' ? 'animate-marquee-reverse' : 'animate-marquee',
        )}
        style={{ animationDuration: `${durationSec}s` }}
      >
        {ticker.tickerText}
      </p>
    </div>
  )
}
