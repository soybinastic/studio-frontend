import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ResponsiveDrawer } from '@/components/layout/ResponsiveDrawer'
import { cn } from '@/lib/utils'

interface StudioPanelShellProps {
  side: 'left' | 'right'
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  expandedWidth?: string
  collapsedWidth?: string
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** When true, panel renders as an overlay drawer instead of inline layout. */
  drawerMode?: boolean
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
  drawerTitle?: string
  className?: string
}

function PanelContent({
  side,
  expanded,
  onExpandedChange,
  header,
  footer,
  children,
  hideCollapseToggle = false,
}: Omit<StudioPanelShellProps, 'drawerMode' | 'drawerOpen' | 'onDrawerOpenChange' | 'drawerTitle' | 'expandedWidth' | 'collapsedWidth' | 'className'> & {
  hideCollapseToggle?: boolean
}) {
  const CollapseIcon = side === 'left' ? ChevronLeft : ChevronRight
  const ExpandIcon = side === 'left' ? ChevronRight : ChevronLeft

  return (
    <>
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-border/50',
          expanded ? 'h-auto min-h-11 gap-2 px-2.5 py-2' : 'h-11 justify-center px-1',
        )}
      >
        {expanded && header ? <div className="min-w-0 flex-1">{header}</div> : null}

        {!hideCollapseToggle && (
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            className="touch-target ml-auto flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
          >
            {expanded ? <CollapseIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      {expanded && footer ? (
        <div className="shrink-0 border-t border-border/50">{footer}</div>
      ) : null}
    </>
  )
}

export function StudioPanelShell({
  side,
  expanded,
  onExpandedChange,
  expandedWidth = 'w-60',
  collapsedWidth = 'w-11',
  header,
  footer,
  children,
  drawerMode = false,
  drawerOpen = false,
  onDrawerOpenChange,
  drawerTitle,
  className,
}: StudioPanelShellProps) {
  if (drawerMode) {
    return (
      <ResponsiveDrawer
        open={drawerOpen}
        onOpenChange={(open) => onDrawerOpenChange?.(open)}
        side={side}
        title={drawerTitle}
        className={cn('w-[min(100%,20rem)]', className)}
      >
        <PanelContent
          side={side}
          expanded
          onExpandedChange={onExpandedChange}
          header={header}
          footer={footer}
          hideCollapseToggle
        >
          {children}
        </PanelContent>
      </ResponsiveDrawer>
    )
  }

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-border/50 bg-surface/95 backdrop-blur-sm transition-[width] duration-200 ease-out md:flex',
        side === 'left' ? 'border-r' : 'border-l',
        expanded ? expandedWidth : collapsedWidth,
        className,
      )}
    >
      <PanelContent
        side={side}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        header={header}
        footer={footer}
      >
        {children}
      </PanelContent>
    </aside>
  )
}
