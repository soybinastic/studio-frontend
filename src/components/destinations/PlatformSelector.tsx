import type { PlatformDefinition } from '@/constants/destinations'
import { PlatformCard } from '@/components/destinations/PlatformCard'

interface PlatformSelectorProps {
  platforms: PlatformDefinition[]
  activePlatformId?: string
  onSelect: (platformId: PlatformDefinition['id']) => void
}

export function PlatformSelector({ platforms, activePlatformId, onSelect }: PlatformSelectorProps) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      role="listbox"
      aria-label="Choose a streaming destination"
    >
      {platforms.map((platform) => (
        <PlatformCard
          key={platform.id}
          platform={platform}
          isActive={activePlatformId === platform.id}
          onSelect={() => onSelect(platform.id)}
        />
      ))}
    </div>
  )
}
