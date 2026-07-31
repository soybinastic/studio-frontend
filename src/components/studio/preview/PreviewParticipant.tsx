import { useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StudioParticipant } from '@/types/participants'

interface PreviewParticipantProps {
  participant: StudioParticipant
  className?: string
}

export function PreviewParticipant({ participant, className }: PreviewParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

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
    >
      {participant.videoTrack && participant.videoEnabled ? (
        <video ref={videoRef} autoPlay playsInline muted={participant.isLocal} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-zinc-800">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
              <User className="h-5 w-5 text-zinc-400" />
            </div>
            <span className="max-w-full truncate px-1 text-[10px] text-zinc-400">
              {participant.displayName}
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
        <span className="truncate text-[10px] font-medium text-white">
          {participant.isHost && '★ '}
          {participant.displayName.replace(' (You)', '')}
        </span>
      </div>

      {!participant.isLocal && <audio ref={audioRef} autoPlay />}
    </div>
  )
}
