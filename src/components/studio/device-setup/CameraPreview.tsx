import { useEffect, useRef } from 'react'
import { CameraOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraPreviewProps {
  stream: MediaStream | null
  enabled?: boolean
  className?: string
}

export function CameraPreview({ stream, enabled = true, className }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    if (stream) void video.play().catch(() => {})
    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-black aspect-video', className)}>
      {stream && enabled ? (
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <CameraOff className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
