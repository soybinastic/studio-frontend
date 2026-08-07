import { useEffect } from 'react'
import type { TickerGraphic } from '@/types/graphics'
import { TICKER_CHAT_Y_NUDGE, CHAT_CANVAS } from '@/lib/chatGeometry'
import { cssFontFamily, ensureFontLoaded } from '@/lib/typography/cssAdapter'
import { resolveDisplayFont } from '@/lib/typography/policy'
import { cn } from '@/lib/utils'

interface PreviewTickerLayerProps {
  ticker: TickerGraphic
  chatActive?: boolean
  fonts?: string | null
}

export function PreviewTickerLayer({
  ticker,
  chatActive = false,
  fonts,
}: PreviewTickerLayerProps) {
  const durationSec = Math.max(8, 24 / (ticker.tickerSpeed || 2))
  const bottomNudge =
    chatActive && ticker.tickerPosition !== 'top'
      ? `${(TICKER_CHAT_Y_NUDGE / CHAT_CANVAS.h) * 100}%`
      : undefined
  const displayFont = resolveDisplayFont(fonts)

  useEffect(() => {
    ensureFontLoaded(displayFont)
  }, [displayFont])

  return (
    <div
      className={cn(
        'absolute left-0 right-0 overflow-hidden py-1',
        ticker.tickerPosition === 'top' ? 'top-0' : 'bottom-0',
      )}
      style={{
        backgroundColor: ticker.primary,
        color: ticker.secondary,
        bottom: bottomNudge,
        fontFamily: cssFontFamily(displayFont),
      }}
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
