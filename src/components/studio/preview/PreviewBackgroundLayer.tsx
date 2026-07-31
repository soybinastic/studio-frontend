import { useEffect, useRef } from 'react'
import type { BackgroundGraphic } from '@/types/graphics'
import { isVideoUrl, resolveGraphicUrl } from '@/lib/graphics'
import { cn } from '@/lib/utils'

interface PreviewBackgroundLayerProps {
  background: BackgroundGraphic
  className?: string
}

export function PreviewBackgroundLayer({ background, className }: PreviewBackgroundLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const url = resolveGraphicUrl(background)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isVideoUrl(url)) return
    video.src = url
    void video.play().catch(() => {})
    return () => {
      video.removeAttribute('src')
      video.load()
    }
  }, [url])

  if (!url) return null

  if (isVideoUrl(url)) {
    return (
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: background.fit === 'stretch' ? '100% 100%' : 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}
