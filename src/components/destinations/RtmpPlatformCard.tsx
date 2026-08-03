import type { RtmpPlatformPreset } from '@/constants/rtmpPlatforms'
import { getStreamingPlatformBrandColor, getStreamingPlatformLabel } from '@/constants/rtmpPlatforms'
import { cn } from '@/lib/utils'

interface RtmpPlatformCardProps {
  preset: RtmpPlatformPreset
  isActive?: boolean
  onSelect: () => void
}

export function RtmpPlatformCard({ preset, isActive, onSelect }: RtmpPlatformCardProps) {
  const initial = preset.name.trim().charAt(0).toUpperCase() || 'R'

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`Connect ${preset.name}`}
      className={cn(
        'group flex w-full flex-col items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.98]',
        isActive ? 'border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border/60',
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
        style={{ backgroundColor: getStreamingPlatformBrandColor(preset.id) }}
        aria-hidden="true"
      >
        {initial}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold tracking-tight">{getStreamingPlatformLabel(preset.id)}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{preset.description}</p>
      </div>
    </button>
  )
}
