import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
}

export function ResponsiveContainer({
  children,
  className,
  as: Tag = 'div',
}: ResponsiveContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
