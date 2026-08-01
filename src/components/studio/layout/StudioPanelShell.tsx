import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
}: StudioPanelShellProps) {
  const CollapseIcon = side === 'left' ? ChevronLeft : ChevronRight
  const ExpandIcon = side === 'left' ? ChevronRight : ChevronLeft

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-border/50 bg-surface/95 backdrop-blur-sm transition-[width] duration-200 ease-out',
        side === 'left' ? 'border-r' : 'border-l',
        expanded ? expandedWidth : collapsedWidth,
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center border-b border-border/50',
          expanded ? 'h-auto min-h-11 gap-2 px-2.5 py-2' : 'h-11 justify-center px-1',
        )}
      >
        {expanded && header ? <div className="min-w-0 flex-1">{header}</div> : null}

        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
        >
          {expanded ? <CollapseIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      {expanded && footer ? (
        <div className="shrink-0 border-t border-border/50">{footer}</div>
      ) : null}
    </aside>
  )
}
