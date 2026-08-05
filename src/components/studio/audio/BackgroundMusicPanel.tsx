import { useCallback, useMemo } from 'react'
import { Music2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BackgroundMusicPicker } from '@/components/studio/audio/BackgroundMusicPicker'
import { BackgroundMusicPlayer } from '@/components/studio/audio/BackgroundMusicPlayer'
import { ProgressBar } from '@/components/studio/audio/ProgressBar'
import { VolumeReadout } from '@/components/studio/audio/VolumeSlider'
import { TrackInformation } from '@/components/studio/audio/TrackInformation'
import { PlaybackStatus } from '@/components/studio/audio/PlaybackStatus'
import { UploadButton } from '@/components/studio/audio/UploadButton'
import { useTenantOptional } from '@/context/TenantProvider'
import type { BackgroundMusicStore } from '@/hooks/useBackgroundMusicStore'
import type { BackgroundMusicPreset } from '@/lib/backgroundMusicPresets'
import { uploadAndRegisterMusic } from '@/lib/uploadStudioAsset'
import { cn } from '@/lib/utils'
import type { TenantMusicTrack } from '@/types/persistence'

interface BackgroundMusicPanelProps {
  isHost: boolean
  store: Pick<
    BackgroundMusicStore,
    | 'config'
    | 'runtime'
    | 'isMutating'
    | 'activeSceneName'
    | 'selectPreset'
    | 'removeTrack'
    | 'play'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'setVolume'
    | 'setMuted'
  >
  className?: string
}

function trackToPreset(track: TenantMusicTrack): BackgroundMusicPreset {
  return {
    uuid: track.track_id,
    title: track.title,
    source: track.source,
    default: track.is_system_default,
    size: track.size,
    meta_data: track.meta_data,
  }
}

export function BackgroundMusicPanel({ isHost, store, className }: BackgroundMusicPanelProps) {
  const {
    config,
    runtime,
    isMutating,
    activeSceneName,
    selectPreset,
    removeTrack,
    play,
    pause,
    resume,
    stop,
    setVolume,
    setMuted,
  } = store

  const tenant = useTenantOptional()
  const catalog = tenant?.configuration?.music_catalog ?? []

  const studioTracks = useMemo(
    () =>
      catalog
        .filter((t) => t.is_active && t.is_system_default)
        .map(trackToPreset),
    [catalog],
  )

  const customTracks = useMemo(
    () =>
      catalog
        .filter((t) => t.is_active && !t.is_system_default)
        .map(trackToPreset),
    [catalog],
  )

  const isPlaying = runtime.playback_state === 'playing' || runtime.playback_state === 'buffering'
  const hasTrack = Boolean(config.track)
  const controlsDisabled = isMutating

  const handleSelect = (preset: BackgroundMusicPreset) => {
    void selectPreset(preset)
  }

  const handleUpload = useCallback(
    async (file: File) => {
      const track = await uploadAndRegisterMusic({ file })
      await tenant?.refreshConfiguration()
      const preset = trackToPreset(track)
      await selectPreset(preset)
      toast.success('Music uploaded')
    },
    [selectPreset, tenant],
  )

  return (
    <div className={cn('space-y-3', className)}>
      <div className="rounded-lg border border-border/60 p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <Music2 className="h-3.5 w-3.5" aria-hidden />
              Background Music
            </Label>
            {activeSceneName ? (
              <p className="text-[10px] text-muted-foreground">Scene: {activeSceneName}</p>
            ) : null}
          </div>
        </div>

        <TrackInformation config={config} runtime={runtime} className="mb-3" />

        <PlaybackStatus
          playbackState={runtime.playback_state}
          errorMessage={runtime.error?.message ?? null}
          errorCode={runtime.error?.code ?? null}
          className="mb-3"
        />

        {isHost ? (
          <BackgroundMusicPlayer
            playbackState={runtime.playback_state}
            positionMs={runtime.position_ms}
            durationMs={runtime.duration_ms}
            volume={config.volume}
            muted={config.muted}
            hasTrack={hasTrack}
            disabled={controlsDisabled}
            onPlay={() => void play()}
            onPause={() => void pause()}
            onResume={() => void resume()}
            onStop={() => void stop()}
            onVolumeChange={(volume) => void setVolume(volume)}
            onMutedChange={(muted) => void setMuted(muted)}
          />
        ) : hasTrack ? (
          <div className="space-y-2">
            <ProgressBar
              positionMs={runtime.position_ms}
              durationMs={runtime.duration_ms}
              playbackState={runtime.playback_state}
            />
            <VolumeReadout volume={config.volume} muted={config.muted} />
          </div>
        ) : null}

        {isPlaying && !isHost ? (
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-live" aria-hidden />
            Background music is active on the program feed
          </p>
        ) : null}

        {isHost ? (
          <div className="mt-4 space-y-3 border-t border-border/40 pt-3">
            <div className="flex flex-wrap gap-2">
              <UploadButton disabled={controlsDisabled} onUpload={handleUpload} />
              {hasTrack ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={controlsDisabled}
                  onClick={() => void removeTrack()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              ) : null}
            </div>

            <BackgroundMusicPicker
              selectedAssetId={config.track?.asset_id}
              disabled={controlsDisabled}
              studioTracks={studioTracks}
              customTracks={customTracks}
              onSelect={handleSelect}
            />

            <p className="text-[10px] text-muted-foreground">
              {isMutating
                ? 'Saving track to this scene…'
                : hasTrack
                  ? 'Preview plays in your browser. Recording and live stream use the server mix.'
                  : 'Click a track to start playing, or upload your own.'}
            </p>
          </div>
        ) : null}
      </div>

      {!isHost ? (
        <p className="text-center text-[10px] text-muted-foreground">
          Playback is controlled by the host. Preview audio plays on the host device.
        </p>
      ) : null}
    </div>
  )
}
