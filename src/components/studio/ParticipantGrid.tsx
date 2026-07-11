import { cn } from '@/lib/utils'
import { VideoTile } from '@/components/studio/VideoTile'
import type { ParticipantMedia } from '@/types/session'

interface ParticipantGridProps {
  participants: ParticipantMedia[]
  className?: string
}

export function ParticipantGrid({ participants, className }: ParticipantGridProps) {
  const count = participants.length

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        count <= 1 && 'grid-cols-1 max-w-3xl mx-auto',
        count === 2 && 'grid-cols-1 sm:grid-cols-2',
        count === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        count >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {participants.map((p) => (
        <VideoTile key={p.peerId} participant={p} />
      ))}
    </div>
  )
}
