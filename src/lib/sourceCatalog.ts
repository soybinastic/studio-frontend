import { normalizeDeviceLabel, normalizeDeviceLabelForMatch } from '@/lib/resolveDevice'
import type {
  CameraSourceSettings,
  PersistedSourceSnapshot,
  PreRecordedSourceSettings,
  SceneItem,
  SceneSourcesConfig,
  Source,
  SourceSettings,
  SourceType,
} from '@/types/sources'
import { getSceneItems } from '@/types/sources'

/** Settings safe to persist across sessions (no live peer/producer ids). */
export function sanitizeSourceSettingsForPersist(
  type: SourceType,
  settings: SourceSettings | undefined,
): SourceSettings {
  const raw = { ...(settings ?? {}) } as Record<string, unknown>
  delete raw.peerId
  delete raw.producerId
  delete raw.audioProducerId

  if (type === 'camera') {
    delete raw.hostWebcamDuplicate
    return {
      deviceId: String(raw.deviceId ?? ''),
      deviceLabel: raw.deviceLabel ? String(raw.deviceLabel) : undefined,
      // Only persist explicit unavailability; host-webcam skip is session-local.
      deviceAvailable: raw.deviceAvailable === false ? false : undefined,
    } satisfies CameraSourceSettings
  }

  if (type === 'screen') {
    return {
      withSystemAudio: Boolean(raw.withSystemAudio),
    }
  }

  if (type === 'prerecorded') {
    return {
      cmsVideoUuid: String(raw.cmsVideoUuid ?? ''),
      title: String(raw.title ?? 'Pre-recorded Video'),
      thumbnailUrl: raw.thumbnailUrl ? String(raw.thumbnailUrl) : undefined,
      duration: raw.duration ? String(raw.duration) : undefined,
      mediaUrl: String(raw.mediaUrl ?? ''),
      // Default on so compositor seeks on EOF instead of deactivating the tile.
      loop: raw.loop !== false,
    } satisfies PreRecordedSourceSettings
  }

  return raw
}

export function sourceIdentityKey(type: SourceType, settings: SourceSettings | undefined): string {
  const raw = (settings ?? {}) as Record<string, unknown>
  if (type === 'camera') {
    const label = raw.deviceLabel ? normalizeDeviceLabel(String(raw.deviceLabel)) : ''
    if (label) return `camera:label:${label}`
    const deviceId = raw.deviceId ? String(raw.deviceId) : ''
    return deviceId ? `camera:id:${deviceId}` : `camera:unknown`
  }
  if (type === 'screen') {
    return 'screen:default'
  }
  if (type === 'prerecorded') {
    const uuid = raw.cmsVideoUuid ? String(raw.cmsVideoUuid) : ''
    if (uuid) return `prerecorded:cms:${uuid}`
    const url = raw.mediaUrl ? String(raw.mediaUrl) : ''
    return url ? `prerecorded:url:${url}` : 'prerecorded:unknown'
  }
  return `${type}:${JSON.stringify(raw)}`
}

/**
 * Find a session-registry Source that matches type + device/CMS identity.
 * Used so Scene B can attach the same sourceId as Scene A instead of creating a duplicate.
 */
export function findMatchingSessionSource(
  sources: Source[],
  type: SourceType,
  settings: SourceSettings | undefined,
): Source | undefined {
  const wantKey = sourceIdentityKey(type, settings)
  const wantCamera = type === 'camera' ? (settings as CameraSourceSettings | undefined) : undefined
  const wantDeviceId = wantCamera?.deviceId?.trim() || ''
  const wantLabel = wantCamera?.deviceLabel
    ? normalizeDeviceLabel(wantCamera.deviceLabel)
    : ''

  for (const source of sources) {
    if (source.type !== type) continue
    if (sourceIdentityKey(source.type, source.settings) === wantKey) {
      return source
    }
    if (type === 'camera') {
      const existing = source.settings as CameraSourceSettings
      const existingId = existing.deviceId?.trim() || ''
      if (wantDeviceId && existingId && wantDeviceId === existingId) {
        return source
      }
      const existingLabel = existing.deviceLabel
        ? normalizeDeviceLabel(existing.deviceLabel)
        : ''
      if (wantLabel && existingLabel && wantLabel === existingLabel) {
        return source
      }
    }
  }
  return undefined
}

export function sourceToSnapshot(source: Source): PersistedSourceSnapshot {
  return {
    sourceId: source.id,
    type: source.type,
    name: source.name,
    volume: source.volume,
    muted: source.muted,
    settings: sanitizeSourceSettingsForPersist(source.type, source.settings),
  }
}

export function buildSourcesCatalog(
  sessionSources: Source[],
  items: SceneItem[],
  extraSources: Source[] = [],
): PersistedSourceSnapshot[] {
  const byId = new Map<string, Source>()
  for (const source of sessionSources) byId.set(source.id, source)
  for (const source of extraSources) byId.set(source.id, source)

  const catalog: PersistedSourceSnapshot[] = []
  const seenIdentity = new Set<string>()

  for (const item of items) {
    const source = byId.get(item.sourceId)
    if (!source) continue
    const key = sourceIdentityKey(source.type, source.settings)
    if (seenIdentity.has(key)) continue
    seenIdentity.add(key)
    catalog.push(sourceToSnapshot(source))
  }

  return catalog
}

export function enrichSceneSourcesConfig(
  config: SceneSourcesConfig,
  sessionSources: Source[],
  extraSources: Source[] = [],
): SceneSourcesConfig {
  const items = getSceneItems(config)
  const catalog = buildSourcesCatalog(sessionSources, items, extraSources)
  return {
    ...config,
    version: 2,
    items,
    sources: catalog,
    assignments: config.assignments ?? {},
  }
}

export function getCatalogFromSceneSources(
  config: SceneSourcesConfig | undefined | null,
): PersistedSourceSnapshot[] {
  if (!config || !Array.isArray(config.sources)) return []
  const rows: PersistedSourceSnapshot[] = []
  for (const row of config.sources) {
    if (
      row &&
      typeof row === 'object' &&
      typeof (row as PersistedSourceSnapshot).sourceId === 'string' &&
      typeof (row as PersistedSourceSnapshot).type === 'string'
    ) {
      rows.push(row as PersistedSourceSnapshot)
    }
  }
  return rows
}

export function isCameraSourceAvailable(source: Source): boolean {
  if (source.type !== 'camera') return true
  const settings = source.settings as CameraSourceSettings
  return settings.deviceAvailable !== false
}

/** True when a Camera Source would duplicate the host's main webcam device. */
export function matchesHostWebcamDevice(
  settings: CameraSourceSettings | undefined,
  host: { deviceId?: string | null; label?: string | null } | undefined,
): boolean {
  if (!settings || !host) return false
  const hostId = host.deviceId?.trim()
  const sourceId = settings.deviceId?.trim()
  if (hostId && sourceId && hostId === sourceId) return true

  const hostLabel = host.label ? normalizeDeviceLabelForMatch(host.label) : ''
  const sourceLabel = settings.deviceLabel
    ? normalizeDeviceLabelForMatch(settings.deviceLabel)
    : ''
  if (hostLabel && sourceLabel && hostLabel === sourceLabel) return true
  return false
}

/** Visible scene attachments only (for preview / layout eligibility). */
export function getVisibleAttachedSourceIds(
  config: SceneSourcesConfig | undefined | null,
): Set<string> {
  const ids = new Set<string>()
  for (const item of getSceneItems(config)) {
    if (item.visible === false) continue
    ids.add(item.sourceId)
  }
  return ids
}
