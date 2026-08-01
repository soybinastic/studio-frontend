import type { PlatformDefinition } from '@/constants/destinations'
import { PlatformIcon } from '@/components/destinations/PlatformIcon'
import { cn } from '@/lib/utils'

interface PlatformCardProps {
  platform: PlatformDefinition
  isActive?: boolean
  onSelect: () => void
}

export function PlatformCard({ platform, isActive, onSelect }: PlatformCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`Connect ${platform.name}`}
      className={cn(
        'group flex w-full flex-col items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.98]',
        isActive ? 'border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border/60',
      )}
    >
      <PlatformIcon platform={platform.id} size="md" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold tracking-tight">{platform.name}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{platform.description}</p>
      </div>
    </button>
  )
}
