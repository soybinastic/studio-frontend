import { cn } from '@/lib/utils'

interface AudioMeterProps {
  level: number
  muted?: boolean
  className?: string
}

export function AudioMeter({ level, muted, className }: AudioMeterProps) {
  const bars = 12
  const activeBars = muted ? 0 : Math.round(level * bars)

  return (
    <div className={cn('flex items-end gap-0.5 h-6', className)}>
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            i < activeBars
              ? i >= bars * 0.75
                ? 'bg-destructive'
                : i >= bars * 0.5
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              : 'bg-muted',
          )}
          style={{ height: `${((i + 1) / bars) * 100}%` }}
        />
      ))}
    </div>
  )
}
