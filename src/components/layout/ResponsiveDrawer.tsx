import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponsiveDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right'
  title?: string
  children: ReactNode
  className?: string
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  side,
  title,
  children,
  className,
}: ResponsiveDrawerProps) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-y-0 z-50 flex w-[min(100%,20rem)] max-w-[85vw] flex-col bg-surface/98 shadow-2xl backdrop-blur-md',
          side === 'left'
            ? 'drawer-slide-left left-0 border-r border-border/50'
            : 'drawer-slide-right right-0 border-l border-border/50',
          className,
        )}
      >
        {title ? (
          <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </aside>
    </>
  )
}
