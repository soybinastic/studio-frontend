import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GraphicsCollapsibleSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  isActive?: boolean
  headerActions?: ReactNode
  children: ReactNode
}

export function GraphicsCollapsibleSection({
  title,
  description,
  defaultOpen = false,
  isActive = false,
  headerActions,
  children,
}: GraphicsCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen || isActive)

  return (
    <div className="rounded-lg border border-border/60 bg-background/40">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
          <span className="truncate text-xs font-semibold uppercase tracking-wide">{title}</span>
          {!open && isActive && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-2 ring-primary/20" aria-hidden />
          )}
        </button>

        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </div>

      {open ? (
        <div className="space-y-2 border-t border-border/40 px-3 pb-3 pt-2">
          {description ? <p className="text-[10px] text-muted-foreground">{description}</p> : null}
          {children}
        </div>
      ) : null}
    </div>
  )
}
