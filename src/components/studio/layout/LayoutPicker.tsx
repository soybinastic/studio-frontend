import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { LayoutPreviewMock } from '@/components/studio/layout/LayoutPreviewMock'
import { LAYOUTS, PRIMARY_LAYOUT_TYPES, getLayoutMeta } from '@/lib/layouts'
import { cn } from '@/lib/utils'
import type { LayoutMeta } from '@/lib/layouts'
import type { LayoutType } from '@/types/session'

interface LayoutPickerProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  disabled?: boolean
}

function LayoutOption({
  item,
  isActive,
  disabled,
  onSelect,
}: {
  item: LayoutMeta
  isActive: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      title={item.description}
      aria-label={`${item.label}: ${item.description}`}
      aria-pressed={isActive}
      className={cn(
        'group flex w-[4.5rem] shrink-0 flex-col gap-1.5 rounded-lg p-1.5 text-left transition-all sm:w-19',
        isActive
          ? 'bg-primary/10 ring-2 ring-primary/40'
          : 'bg-background/60 hover:bg-muted/70 ring-1 ring-border/50 hover:ring-border',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <div
        className={cn(
          'aspect-video w-full overflow-hidden rounded-md',
          isActive ? 'bg-zinc-800' : 'bg-zinc-700/90 group-hover:bg-zinc-800',
        )}
      >
        <LayoutPreviewMock layout={item.type} tone="overlay" className="h-full" />
      </div>
      <span
        className={cn(
          'block truncate text-center text-[10px] font-medium leading-tight',
          isActive ? 'text-primary' : 'text-foreground/80',
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

export function LayoutPicker({ layout, onLayoutChange, disabled }: LayoutPickerProps) {
  const [showAll, setShowAll] = useState(false)
  const activeMeta = getLayoutMeta(layout)
  const hasMoreLayouts = LAYOUTS.length > PRIMARY_LAYOUT_TYPES.length

  const primaryLayouts = useMemo(
    () => LAYOUTS.filter((item) => PRIMARY_LAYOUT_TYPES.includes(item.type)),
    [],
  )

  useEffect(() => {
    if (!PRIMARY_LAYOUT_TYPES.includes(layout)) {
      setShowAll(true)
    }
  }, [layout])

  const visibleLayouts = showAll ? LAYOUTS : primaryLayouts

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-2 flex items-center justify-center gap-2 text-center">
        <span className="text-xs font-medium text-muted-foreground">Layout</span>
        <span className="text-xs text-muted-foreground/60">·</span>
        <span className="text-xs font-medium">{activeMeta.label}</span>
        {disabled && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      <div
        className={cn(
          'flex w-full max-w-4xl gap-2',
          showAll
            ? 'studio-panel-scroll -mx-1 flex-nowrap overflow-x-auto px-1 pb-1'
            : 'flex-wrap justify-center sm:flex-nowrap',
        )}
      >
        {visibleLayouts.map((item) => (
          <LayoutOption
            key={item.type}
            item={item}
            isActive={layout === item.type}
            disabled={disabled}
            onSelect={() => onLayoutChange(item.type)}
          />
        ))}
      </div>

      {hasMoreLayouts && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-2 flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={showAll}
        >
          {showAll ? 'Show less' : 'See more layouts'}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-200', showAll && 'rotate-180')}
          />
        </button>
      )}
    </div>
  )
}
