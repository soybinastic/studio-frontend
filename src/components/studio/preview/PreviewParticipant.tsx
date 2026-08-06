import { useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { PreviewVideoFit } from '@/lib/layouts'
import type { StudioParticipant } from '@/types/participants'

interface PreviewParticipantProps {
  participant: StudioParticipant
  className?: string
  videoFit?: PreviewVideoFit
  style?: CSSProperties
}

export function PreviewParticipant({
  participant,
  className,
  videoFit = 'contain',
  style,
}: PreviewParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const displayName = participant.displayName.replace(' (You)', '')
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    const video = videoRef.current
    if (!video || !participant.videoTrack || !participant.videoEnabled) return
    const stream = new MediaStream([participant.videoTrack])
    video.srcObject = stream
    void video.play().catch(() => {})
    return () => {
      video.srcObject = null
    }
  }, [participant.videoTrack, participant.videoEnabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !participant.audioTrack || participant.isLocal) return
    const stream = new MediaStream([participant.audioTrack])
    audio.srcObject = stream
    void audio.play().catch(() => {})
    return () => {
      audio.srcObject = null
    }
  }, [participant.audioTrack, participant.isLocal])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm bg-zinc-900',
        participant.isSpeaking && 'ring-2 ring-primary',
        className,
      )}
      style={style}
    >
      {participant.videoTrack && participant.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className={cn('h-full w-full', videoFit === 'cover' ? 'object-cover' : 'object-contain')}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-zinc-800">
          <div className="flex max-w-full flex-col items-center gap-1.5 px-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700">
              <span className="text-lg font-semibold text-zinc-200">{initials || '?'}</span>
            </div>
            <span className="max-w-full truncate text-[10px] text-zinc-400">{displayName}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
        <span className="truncate text-[10px] font-medium text-white">
          {participant.isHost && '★ '}
          {displayName}
        </span>
      </div>

      {!participant.isLocal && <audio ref={audioRef} autoPlay />}
    </div>
  )
}
