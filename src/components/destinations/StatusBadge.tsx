import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { DestinationStatus } from '@/types/destinations'
import { STATUS_DEFINITIONS } from '@/constants/destinations'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: DestinationStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const def = STATUS_DEFINITIONS[status]
  const isAnimated = status === 'connecting' || status === 'streaming'

  return (
    <Badge variant={def.badgeVariant} className={cn('gap-1.5', className)}>
      {showDot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            def.dotColor,
            isAnimated && 'animate-pulse',
          )}
          aria-hidden="true"
        />
      )}
      {status === 'connecting' && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
      {def.label}
    </Badge>
  )
}
