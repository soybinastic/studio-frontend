import { ProgressBar } from '@/components/studio/audio/ProgressBar'
import { PlaybackControls } from '@/components/studio/audio/PlaybackControls'
import { VolumeSlider } from '@/components/studio/audio/VolumeSlider'
import type { BackgroundMusicPlaybackState } from '@/types/backgroundMusic'
import { cn } from '@/lib/utils'

interface BackgroundMusicPlayerProps {
  playbackState: BackgroundMusicPlaybackState
  positionMs: number
  durationMs: number
  volume: number
  muted: boolean
  hasTrack: boolean
  disabled?: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onVolumeChange: (volume: number) => void
  onMutedChange: (muted: boolean) => void
  className?: string
}

export function BackgroundMusicPlayer({
  playbackState,
  positionMs,
  durationMs,
  volume,
  muted,
  hasTrack,
  disabled,
  onPlay,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
  onMutedChange,
  className,
}: BackgroundMusicPlayerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {hasTrack ? (
        <ProgressBar
          positionMs={positionMs}
          durationMs={durationMs}
          playbackState={playbackState}
        />
      ) : null}
      <PlaybackControls
        playbackState={playbackState}
        hasTrack={hasTrack}
        disabled={disabled}
        onPlay={onPlay}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
      />
      <VolumeSlider
        volume={volume}
        muted={muted}
        disabled={disabled || !hasTrack}
        onVolumeChange={onVolumeChange}
        onMutedChange={onMutedChange}
      />
    </div>
  )
}
