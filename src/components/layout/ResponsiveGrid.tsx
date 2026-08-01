import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ResponsiveGridCols = 1 | 2 | 3 | 4

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: ResponsiveGridCols
  smCols?: ResponsiveGridCols
  mdCols?: ResponsiveGridCols
  lgCols?: ResponsiveGridCols
  gap?: 'sm' | 'md' | 'lg'
}

const colClasses: Record<ResponsiveGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
}

export function ResponsiveGrid({
  children,
  className,
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  gap = 'md',
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid',
        colClasses[cols],
        smCols && `sm:${colClasses[smCols]}`,
        mdCols && `md:${colClasses[mdCols]}`,
        lgCols && `lg:${colClasses[lgCols]}`,
        gapClasses[gap],
        className,
      )}
    >
      {children}
    </div>
  )
}
