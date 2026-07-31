import { useEffect, useState } from 'react'
import type { CountdownState } from '@/types/session'
import { countdownSecondsRemaining, formatCountdownLabel } from '@/lib/countdown'
import { cn } from '@/lib/utils'

interface PreviewCountdownLayerProps {
  countdownState: CountdownState | null
}

export function PreviewCountdownLayer({ countdownState }: PreviewCountdownLayerProps) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!countdownState?.active) {
      setRemaining(0)
      return
    }

    const tick = () => setRemaining(countdownSecondsRemaining(countdownState))
    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [countdownState])

  if (!countdownState?.active || remaining <= 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center">
      <div
        className={cn(
          'rounded-2xl bg-black/80 px-10 py-6 shadow-2xl ring-1 ring-white/10',
          'font-mono text-5xl font-semibold tracking-wider text-white sm:text-6xl',
        )}
        aria-live="polite"
        aria-label={`Countdown ${formatCountdownLabel(remaining)}`}
      >
        {formatCountdownLabel(remaining)}
      </div>
    </div>
  )
}
