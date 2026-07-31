import { Loader2, Music2 } from 'lucide-react'
import {
  isBackgroundMusicActiveInPreview,
  previewBackgroundMusicLabel,
} from '@/lib/backgroundMusic'
import type { BackgroundMusicPlaybackState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

export interface PreviewBackgroundMusicState {
  hasTrack: boolean
  trackTitle: string | null
  playbackState: BackgroundMusicPlaybackState
  muted: boolean
}

interface BackgroundMusicIndicatorProps {
  backgroundMusic: PreviewBackgroundMusicState | null
  className?: string
}

function EqualizerBars() {
  return (
    <div className="flex h-3.5 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className="animate-bgm-eq h-full w-0.5 rounded-full bg-emerald-400"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </div>
  )
}

function showEqualizer(state: BackgroundMusicPlaybackState): boolean {
  return state === 'playing' || state === 'buffering'
}

export function BackgroundMusicIndicator({
  backgroundMusic,
  className,
}: BackgroundMusicIndicatorProps) {
  if (!backgroundMusic?.hasTrack) return null
  if (!isBackgroundMusicActiveInPreview(backgroundMusic.playbackState, true)) {
    return null
  }

  const label = previewBackgroundMusicLabel(backgroundMusic.playbackState, backgroundMusic.muted)
  const animate = showEqualizer(backgroundMusic.playbackState)
  const loading = backgroundMusic.playbackState === 'loading'

  return (
    <div
      className={cn(
        'absolute bottom-2 right-2 z-20 flex max-w-[min(100%,14rem)] items-center gap-2 rounded-lg border border-white/10 bg-black/65 px-2.5 py-1.5 text-white shadow-lg backdrop-blur-sm',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-400" aria-hidden />
      ) : animate ? (
        <EqualizerBars />
      ) : (
        <Music2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
      )}

      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium leading-tight">{label}</p>
        {backgroundMusic.trackTitle ? (
          <p className="truncate text-[9px] text-white/70">{backgroundMusic.trackTitle}</p>
        ) : null}
      </div>
    </div>
  )
}
