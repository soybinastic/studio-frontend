import { useEffect, useRef } from 'react'
import { MicOff, VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { ParticipantMedia } from '@/types/session'

interface VideoTileProps {
  participant: ParticipantMedia
  className?: string
}

export function VideoTile({ participant, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    if (participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack])
      videoEl.srcObject = stream
      void videoEl.play().catch(() => {})
    } else {
      videoEl.srcObject = null
    }
  }, [participant.videoTrack])

  useEffect(() => {
    const audioEl = audioRef.current
    if (!audioEl || participant.isLocal) return

    if (participant.audioTrack) {
      const stream = new MediaStream([participant.audioTrack])
      audioEl.srcObject = stream
      void audioEl.play().catch(() => {})
    } else {
      audioEl.srcObject = null
    }
  }, [participant.audioTrack, participant.isLocal])

  const initials = participant.displayName
    .replace(' (You)', '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'group relative aspect-video overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm',
        className,
      )}
    >
      {participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <span className="text-3xl font-semibold text-muted-foreground/70">{initials}</span>
        </div>
      )}

      {!participant.isLocal && participant.audioTrack && (
        <audio ref={audioRef} autoPlay playsInline />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-white">{participant.displayName}</span>
          <div className="flex shrink-0 items-center gap-1">
            {!participant.audioEnabled && (
              <Badge variant="destructive" className="h-6 gap-1 px-1.5">
                <MicOff className="h-3 w-3" />
              </Badge>
            )}
            {!participant.videoEnabled && (
              <Badge variant="secondary" className="h-6 gap-1 px-1.5">
                <VideoOff className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
