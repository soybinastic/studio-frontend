import type { BackgroundMusicConfig } from '@/types/scenes'

export const SUPPORTED_BACKGROUND_MUSIC_MIMES = [
  'audio/mpeg',
  'audio/wav',
  'audio/aac',
  'audio/mp4',
  'audio/ogg',
] as const

export type SupportedBackgroundMusicMime = (typeof SUPPORTED_BACKGROUND_MUSIC_MIMES)[number]

export type BackgroundMusicPlaybackState =
  | 'idle'
  | 'uploading'
  | 'ready'
  | 'loading'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error'

export type BackgroundMusicSyncState = 'synced' | 'pending' | 'stale' | 'disconnected'

export type BackgroundMusicRejectionReason =
  | 'no_track_loaded'
  | 'unsupported_format'
  | 'file_missing'
  | 'decode_failed'
  | 'already_playing'
  | 'backend_unavailable'
  | 'playback_timeout'
  | 'scene_not_active'

export interface BackgroundMusicError {
  code: BackgroundMusicRejectionReason | 'unknown'
  message: string
}

export interface BackgroundMusicRuntimeState {
  scene_id: string | null
  playback_state: BackgroundMusicPlaybackState
  position_ms: number
  duration_ms: number
  error: BackgroundMusicError | null
  updated_at: string
}

export interface BackgroundMusicCommandAck {
  accepted: boolean
  state: BackgroundMusicRuntimeState
  rejection_reason?: BackgroundMusicRejectionReason
}

export type BackgroundMusicEvent =
  | { type: 'background_music.state'; payload: BackgroundMusicRuntimeState }
  | { type: 'background_music.position'; payload: { position_ms: number; updated_at: string } }
  | { type: 'background_music.error'; payload: BackgroundMusicError }

export interface BackgroundMusicEventHandlers {
  onState?: (state: BackgroundMusicRuntimeState) => void
  onPosition?: (positionMs: number, updatedAt: string) => void
  onError?: (error: BackgroundMusicError) => void
}

export interface BackgroundMusicStoreState {
  config: BackgroundMusicConfig
  runtime: BackgroundMusicRuntimeState
  syncState: BackgroundMusicSyncState
  pendingCommand: string | null
  isMutating: boolean
}
