import { Timer } from 'lucide-react'
import { LayoutPreviewMock } from '@/components/studio/layout/LayoutPreviewMock'
import type { Scene } from '@/types/scenes'
import type { LayoutType } from '@/types/session'
import { resolveGraphicUrl } from '@/lib/graphics'
import { cn } from '@/lib/utils'

interface ScenePreviewThumbnailProps {
  scene: Scene
  className?: string
}

export function ScenePreviewThumbnail({ scene, className }: ScenePreviewThumbnailProps) {
  const isCountdown = scene.type === 'COUNTDOWN'
  const layout = (scene.layout || 'FULLSCREEN') as LayoutType
  const backgroundUrl = resolveGraphicUrl(scene.graphics_config?.background)

  return (
    <div
      className={cn(
        'relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-violet-400/70 via-slate-400/60 to-sky-500/70',
        className,
      )}
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      ) : null}

      <div className="absolute inset-0 bg-black/10" />

      <div className="relative h-full w-full">
        {isCountdown ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1.5 text-white/95">
            <Timer className="h-4 w-4" strokeWidth={1.5} />
            {scene.countdown?.duration_seconds ? (
              <span className="text-[9px] font-medium tabular-nums">
                {scene.countdown.duration_seconds}s
              </span>
            ) : null}
          </div>
        ) : (
          <LayoutPreviewMock layout={layout} tone="overlay" />
        )}
      </div>
    </div>
  )
}
