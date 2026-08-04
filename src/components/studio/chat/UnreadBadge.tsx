import { cn } from '@/lib/utils'

interface UnreadBadgeProps {
  count: number
  className?: string
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null

  const label = count > 99 ? '99+' : String(count)

  return (
    <span
      className={cn(
        'inline-flex min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[9px] font-semibold leading-none text-primary-foreground',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  )
}
