import { LayoutGrid } from 'lucide-react'
import { LAYOUTS } from '@/lib/layouts'
import { cn } from '@/lib/utils'
import type { LayoutType } from '@/types/session'

interface LayoutPickerProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  disabled?: boolean
}

export function LayoutPicker({ layout, onLayoutChange, disabled }: LayoutPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <LayoutGrid className="h-3.5 w-3.5" />
        Layout
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {LAYOUTS.map((l) => (
          <button
            key={l.type}
            type="button"
            disabled={disabled}
            onClick={() => onLayoutChange(l.type)}
            className={cn(
              'rounded-lg border px-2 py-2 text-left transition-colors',
              layout === l.type
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 hover:border-border hover:bg-muted/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span className="block text-[11px] font-medium leading-tight">{l.label}</span>
            <span className="mt-0.5 block text-[9px] leading-tight text-muted-foreground line-clamp-2">
              {l.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
