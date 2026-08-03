import type { ReactNode } from 'react'
import type { ConnectedDestination } from '@/types/destinations'
import { ConnectedDestinationCard } from '@/components/destinations/ConnectedDestinationCard'

interface DestinationGridProps {
  destinations: ConnectedDestination[]
  onDisconnect: (id: string) => void
  onReconnect: (id: string) => void
  onRemove: (id: string) => void
  emptyState?: ReactNode
}

export function DestinationGrid({
  destinations,
  onDisconnect,
  onReconnect,
  onRemove,
  emptyState,
}: DestinationGridProps) {
  if (destinations.length === 0) {
    return emptyState ? <>{emptyState}</> : null
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-label="Connected destinations">
      {destinations.map((destination) => (
        <li key={destination.id}>
          <ConnectedDestinationCard
            destination={destination}
            onDisconnect={onDisconnect}
            onReconnect={onReconnect}
            onRemove={onRemove}
          />
        </li>
      ))}
    </ul>
  )
}
