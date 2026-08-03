import { MoreHorizontal, RefreshCw, Trash2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConnectedDestination } from '@/types/destinations'
import { DestinationStatus as Status } from '@/types/destinations'
import { getPlatformLabel, PlatformIcon } from '@/components/destinations/PlatformIcon'
import { StatusBadge } from '@/components/destinations/StatusBadge'
import { cn } from '@/lib/utils'

interface ConnectedDestinationCardProps {
  destination: ConnectedDestination
  onDisconnect: (id: string) => void
  onReconnect: (id: string) => void
  onRemove: (id: string) => void
}

export function ConnectedDestinationCard({
  destination,
  onDisconnect,
  onReconnect,
  onRemove,
}: ConnectedDestinationCardProps) {
  const platformLabel = getPlatformLabel(destination.platform)
  const isDisconnected = destination.status === Status.DISCONNECTED
  const isAuthExpired = destination.status === Status.AUTH_EXPIRED
  const isConnecting = destination.status === Status.CONNECTING

  return (
    <article
      className={cn(
        'destination-animate-fade flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow sm:gap-4 sm:p-5',
        destination.status === Status.STREAMING && 'border-live/30 ring-1 ring-live/10',
        destination.status === Status.ERROR && 'border-destructive/30',
        destination.status === Status.CONNECTED && 'border-border/60 hover:shadow-md',
      )}
      aria-label={`${destination.name}, ${platformLabel}, ${destination.status}`}
    >
      <PlatformIcon platform={destination.platform} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-semibold tracking-tight">{destination.name}</p>
          <StatusBadge status={destination.status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{platformLabel}</p>
        {destination.facebookTarget && (
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            Facebook {destination.facebookTarget}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={`Actions for ${destination.name}`}
            disabled={isConnecting}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(isDisconnected || isAuthExpired) && (
            <DropdownMenuItem onClick={() => onReconnect(destination.id)}>
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </DropdownMenuItem>
          )}
          {destination.status === Status.CONNECTED && (
            <DropdownMenuItem onClick={() => onDisconnect(destination.id)}>
              <Unplug className="h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onRemove(destination.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  )
}
