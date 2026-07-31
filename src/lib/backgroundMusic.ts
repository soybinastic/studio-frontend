import type {
  BackgroundMusicPlaybackState,
  BackgroundMusicRuntimeState,
  BackgroundMusicSyncState,
} from '@/types/backgroundMusic'
import type { BackgroundMusicConfig } from '@/types/scenes'
import type { BackgroundMusicPreset } from '@/lib/backgroundMusicPresets'

export const DEFAULT_BACKGROUND_MUSIC_CONFIG: BackgroundMusicConfig = {
  version: 1,
  enabled: false,
  track: null,
  volume: 0.5,
  loop: true,
  muted: false,
}

export function normalizeBackgroundMusicConfig(
  config: Partial<BackgroundMusicConfig> | null | undefined,
): BackgroundMusicConfig {
  if (!config) return { ...DEFAULT_BACKGROUND_MUSIC_CONFIG }
  return {
    version: 1,
    enabled: config.enabled ?? DEFAULT_BACKGROUND_MUSIC_CONFIG.enabled,
    track: config.track ?? null,
    volume: config.volume ?? DEFAULT_BACKGROUND_MUSIC_CONFIG.volume,
    loop: config.loop ?? DEFAULT_BACKGROUND_MUSIC_CONFIG.loop,
    muted: config.muted ?? DEFAULT_BACKGROUND_MUSIC_CONFIG.muted,
  }
}

export function presetToTrack(preset: BackgroundMusicPreset): NonNullable<BackgroundMusicConfig['track']> {
  return {
    asset_id: preset.uuid,
    url: preset.source,
    title: preset.title,
  }
}

export function derivePlaybackStateFromConfig(
  config: BackgroundMusicConfig,
): BackgroundMusicPlaybackState {
  if (!config.track) return 'idle'
  if (config.enabled) return 'ready'
  return 'ready'
}

export function deriveOptimisticRuntimeFromConfig(
  sceneId: string | null,
  config: BackgroundMusicConfig,
): BackgroundMusicRuntimeState {
  return {
    scene_id: sceneId,
    playback_state: derivePlaybackStateFromConfig(config),
    position_ms: 0,
    duration_ms: 0,
    error: null,
    updated_at: new Date().toISOString(),
  }
}

export function formatBackgroundMusicDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function playbackStateLabel(state: BackgroundMusicPlaybackState): string {
  switch (state) {
    case 'idle':
      return 'Idle'
    case 'uploading':
      return 'Uploading'
    case 'ready':
      return 'Ready'
    case 'loading':
      return 'Loading'
    case 'buffering':
      return 'Buffering'
    case 'playing':
      return 'Playing'
    case 'paused':
      return 'Paused'
    case 'stopped':
      return 'Stopped'
    case 'error':
      return 'Error'
    default:
      return 'Unknown'
  }
}

export function volumeToPercent(volume: number): number {
  return Math.round(Math.max(0, Math.min(1, volume)) * 100)
}

export function percentToVolume(percent: number): number {
  return Math.max(0, Math.min(100, percent)) / 100
}

export function isBackgroundMusicActiveInPreview(
  playbackState: BackgroundMusicPlaybackState,
  hasTrack: boolean,
): boolean {
  if (!hasTrack) return false
  return (
    playbackState === 'playing' ||
    playbackState === 'buffering' ||
    playbackState === 'loading' ||
    playbackState === 'paused'
  )
}

export function previewBackgroundMusicLabel(
  playbackState: BackgroundMusicPlaybackState,
  muted: boolean,
): string {
  if (muted && (playbackState === 'playing' || playbackState === 'buffering')) {
    return 'Background Music (Muted)'
  }
  switch (playbackState) {
    case 'playing':
    case 'buffering':
      return 'Background Music Playing'
    case 'loading':
      return 'Background Music Loading'
    case 'paused':
      return 'Background Music Paused'
    default:
      return 'Background Music'
  }
}

export function backgroundMusicErrorMessage(
  code: string | undefined,
  fallback?: string,
): string {
  switch (code) {
    case 'unsupported_format':
      return 'This file type is not supported. Use MP3, WAV, AAC, M4A, or OGG.'
    case 'upload failure':
    case 'upload_failed':
      return 'Upload failed. Check your connection and try again.'
    case 'decode_failed':
      return 'Could not play this file. Try a different track.'
    case 'file_missing':
      return 'This track is no longer available on the server.'
    case 'backend_unavailable':
      return 'Studio audio service is unavailable.'
    case 'playback_timeout':
      return 'Playback did not start in time. Try again.'
    case 'lost synchronization':
    case 'lost_sync':
      return 'Audio sync was lost. Refreshing state…'
    case 'no_track_loaded':
      return 'Select a track before starting playback.'
    case 'already_playing':
      return 'Background music is already playing.'
    case 'scene_not_active':
      return 'Switch to this scene before controlling its music.'
    default:
      return fallback ?? 'Background music encountered an error.'
  }
}

export function syncStateHint(syncState: BackgroundMusicSyncState): string | null {
  switch (syncState) {
    case 'synced':
      return null
    case 'pending':
      return 'Waiting for the compositor to confirm your last action.'
    case 'stale':
      return 'Playback state may be out of date. Refresh to resync with the backend.'
    case 'disconnected':
      return 'Cannot reach the compositor audio service. Check your connection and refresh.'
    default:
      return null
  }
}
