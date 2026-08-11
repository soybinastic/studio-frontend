/** Studio Sources domain — global runtime Sources + scene attachments. */

export type SourceType =
  | 'camera'
  | 'screen'
  | 'prerecorded'
  | 'image'
  | 'rtmp'
  | 'audio'
  | 'pdf'

export type SourceState = 'LOADING' | 'ACTIVE' | 'PAUSED' | 'STOPPED'

export interface CameraSourceSettings {
  deviceId: string
  deviceLabel?: string
  peerId?: string
  producerId?: string
  /** False when the labeled device is missing on this machine after hydrate. */
  deviceAvailable?: boolean
  /** True when restore skipped produce because this is the host main webcam. */
  hostWebcamDuplicate?: boolean
}

export interface ScreenSourceSettings {
  peerId?: string
  producerId?: string
  withSystemAudio?: boolean
}

export interface PreRecordedSourceSettings {
  cmsVideoUuid: string
  title: string
  thumbnailUrl?: string
  duration?: string
  /** Prefer progressive MP4 (`source_file`); HLS (`output_file`) as fallback. */
  mediaUrl: string
  loop?: boolean
}

export interface AudioSourceSettings {
  cmsAudioUuid: string
  title: string
  mediaUrl: string
  loop?: boolean
}

export interface RtmpSourceSettings {
  url: string
}

export interface ImageSourceSettings {
  url: string
  fitMode?: 'contain' | 'cover' | 'fill'
}

export interface PdfSourceSettings {
  url: string
  page?: number
  zoom?: number
  fitMode?: 'contain' | 'cover' | 'width'
}

export type SourceSettings =
  | CameraSourceSettings
  | ScreenSourceSettings
  | PreRecordedSourceSettings
  | AudioSourceSettings
  | RtmpSourceSettings
  | ImageSourceSettings
  | PdfSourceSettings
  | Record<string, unknown>

/** Snapshot stored in scene `sources_config.sources` for cross-session restore. */
export interface PersistedSourceSnapshot {
  sourceId: string
  type: SourceType
  name: string
  volume?: number
  muted?: boolean
  settings: SourceSettings
}

/** Session-scoped reusable media source (runtime). */
export interface Source {
  id: string
  type: SourceType
  name: string
  state: SourceState
  volume: number
  muted: boolean
  settings: SourceSettings
  created_at?: string
  updated_at?: string
}

/**
 * Scene attachment only — layout strategies own geometry.
 * No freeform x/y/width/height/rotation/crop/opacity.
 */
export interface SceneItem {
  id: string
  sceneId: string
  sourceId: string
  visible: boolean
  zIndex: number
}

export interface SceneSourcesConfigV2 {
  version: 2
  /** Scene attachments (preferred). */
  items: SceneItem[]
  /** Slot index → sourceId for layout strategies (derived from ordered visible items). */
  assignments?: Record<string, string>
  /** Persisted Source catalog snapshots for hydrate/restore. */
  sources?: PersistedSourceSnapshot[]
}

export interface SceneSourcesConfigV1 {
  version: 1
  sources: PersistedSourceSnapshot[] | unknown[]
  assignments?: Record<string, string>
  items?: SceneItem[]
}

export type SceneSourcesConfig = SceneSourcesConfigV1 | SceneSourcesConfigV2

export function isSceneSourcesConfigV2(
  config: SceneSourcesConfig | undefined | null,
): config is SceneSourcesConfigV2 {
  return Boolean(config && config.version >= 2)
}

export function getSceneItems(config: SceneSourcesConfig | undefined | null): SceneItem[] {
  if (!config) return []
  if (Array.isArray(config.items)) return config.items
  return []
}

/** Derive layout assignments from SceneItem order (visible only, by zIndex). */
export function assignmentsFromSceneItems(items: SceneItem[]): Record<string, string> {
  const ordered = [...items]
    .filter((item) => item.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
  const assignments: Record<string, string> = {}
  ordered.forEach((item, index) => {
    assignments[String(index)] = item.sourceId
  })
  return assignments
}

export interface CreateSourceRequest {
  type: SourceType
  name?: string
  settings?: SourceSettings
  volume?: number
  muted?: boolean
  start?: boolean
}

export interface UpdateSourceRequest {
  name?: string
  volume?: number
  muted?: boolean
  settings?: SourceSettings
  state?: SourceState
}

export interface SourcePlaybackRequest {
  position_ms?: number
  loop?: boolean
}
