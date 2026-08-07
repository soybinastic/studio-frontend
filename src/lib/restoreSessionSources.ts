import { createSource, listSources, updateSource } from '@/api/sources'
import { listScenes, updateScene } from '@/api/scenes'
import { enumerateMediaDevices } from '@/lib/devices'
import { persistSceneSources } from '@/lib/persistenceSync'
import { resolveMediaDevice } from '@/lib/resolveDevice'
import {
  getCatalogFromSceneSources,
  matchesHostWebcamDevice,
  sanitizeSourceSettingsForPersist,
  sourceIdentityKey,
  sourceToSnapshot,
} from '@/lib/sourceCatalog'
import type { Scene } from '@/types/scenes'
import type {
  CameraSourceSettings,
  PersistedSourceSnapshot,
  PreRecordedSourceSettings,
  SceneItem,
  Source,
} from '@/types/sources'
import { assignmentsFromSceneItems, getSceneItems } from '@/types/sources'

export interface RestoreSessionSourcesOptions {
  sessionId: string
  peerId: string
  /** Host main webcam — skip producing Camera Sources that match (avoids duplicate program tiles). */
  hostWebcam?: { deviceId?: string | null; label?: string | null }
  produceCameraSource?: (sourceId: string, deviceId: string) => Promise<{ producerId: string }>
  playSource?: (sourceId: string) => Promise<unknown>
}

export interface RestoreSessionSourcesResult {
  sources: Source[]
  scenes: Scene[]
  unavailableCameraLabels: string[]
  skippedHostWebcamDuplicates: string[]
}

function remapItems(items: SceneItem[], idMap: Map<string, string>, sceneId: string): SceneItem[] {
  return items.map((item, index) => ({
    ...item,
    sceneId: item.sceneId || sceneId,
    sourceId: idMap.get(item.sourceId) ?? item.sourceId,
    zIndex: item.zIndex ?? index,
  }))
}

/**
 * Recreate SessionSources from persisted scene catalogs, remap SceneItems to new
 * source ids, then produce cameras (by device label) / start prerecorded playback.
 */
export async function restoreSessionSources(
  options: RestoreSessionSourcesOptions,
): Promise<RestoreSessionSourcesResult> {
  const { sessionId, peerId, hostWebcam, produceCameraSource, playSource } = options
  const unavailableCameraLabels: string[] = []
  const skippedHostWebcamDuplicates: string[] = []

  let scenes = await listScenes(sessionId)
  let existing = await listSources(sessionId)
  const byIdentity = new Map<string, Source>()
  for (const source of existing) {
    byIdentity.set(sourceIdentityKey(source.type, source.settings), source)
  }

  /** Old persisted sourceId → live session sourceId */
  const idMap = new Map<string, string>()

  const catalogByOldId = new Map<string, PersistedSourceSnapshot>()
  for (const scene of scenes) {
    if (scene.type !== 'CAMERA') continue
    for (const snap of getCatalogFromSceneSources(scene.sources)) {
      catalogByOldId.set(snap.sourceId, snap)
    }
  }

  // Also accept legacy scenes that only have items (no catalog): nothing to restore.
  for (const snap of catalogByOldId.values()) {
    const identity = sourceIdentityKey(snap.type, snap.settings)
    let live = byIdentity.get(identity)
    if (!live) {
      live = await createSource(sessionId, {
        type: snap.type,
        name: snap.name,
        settings: {
          ...sanitizeSourceSettingsForPersist(snap.type, snap.settings),
          ...(snap.type === 'camera' || snap.type === 'screen' ? { peerId } : {}),
        },
        volume: snap.volume ?? 1,
        muted: snap.muted ?? false,
        start: snap.type === 'prerecorded',
      })
      byIdentity.set(identity, live)
      existing = [...existing.filter((row) => row.id !== live!.id), live]
    }
    idMap.set(snap.sourceId, live.id)
  }

  // Remap scene items + rewrite catalog with live ids
  for (const scene of scenes) {
    if (scene.type !== 'CAMERA') continue
    const items = getSceneItems(scene.sources)
    if (items.length === 0 && getCatalogFromSceneSources(scene.sources).length === 0) continue

    const remappedItems = remapItems(items, idMap, scene.scene_id)
    const catalog: PersistedSourceSnapshot[] = []
    const seen = new Set<string>()
    for (const item of remappedItems) {
      const live = existing.find((row) => row.id === item.sourceId)
      if (!live || seen.has(live.id)) continue
      seen.add(live.id)
      catalog.push(sourceToSnapshot(live))
    }

    const nextSources = {
      version: 2 as const,
      items: remappedItems,
      assignments: assignmentsFromSceneItems(remappedItems),
      sources: catalog,
    }

    const updated = await updateScene(sessionId, scene.scene_id, { sources: nextSources })
    void persistSceneSources(sessionId, scene.scene_id, nextSources)
    scenes = scenes.map((row) => (row.scene_id === updated.scene_id ? updated : row))
  }

  // Produce cameras / play prerecorded
  const devices = await enumerateMediaDevices()
  const refreshed: Source[] = []

  for (const source of existing) {
    if (source.type === 'camera') {
      const settings = source.settings as CameraSourceSettings
      const device = resolveMediaDevice(
        devices,
        { deviceId: settings.deviceId, label: settings.deviceLabel },
        'videoinput',
      )

      // Do not publish a Camera Source that duplicates the host main webcam.
      const resolvedSettings: CameraSourceSettings = {
        ...settings,
        deviceId: device?.deviceId || settings.deviceId,
        deviceLabel: device?.label || settings.deviceLabel,
      }
      if (matchesHostWebcamDevice(resolvedSettings, hostWebcam)) {
        const label = resolvedSettings.deviceLabel || resolvedSettings.deviceId || source.name
        skippedHostWebcamDuplicates.push(label)
        const updated = await updateSource(sessionId, source.id, {
          settings: {
            ...resolvedSettings,
            peerId,
            deviceAvailable: false,
          } satisfies CameraSourceSettings,
        })
        refreshed.push(updated)
        continue
      }

      if (!device || !produceCameraSource) {
        const label = settings.deviceLabel || settings.deviceId || source.name
        unavailableCameraLabels.push(label)
        const updated = await updateSource(sessionId, source.id, {
          settings: {
            ...settings,
            peerId,
            deviceAvailable: false,
          } satisfies CameraSourceSettings,
        })
        refreshed.push(updated)
        continue
      }

      try {
        const { producerId } = await produceCameraSource(source.id, device.deviceId)
        const updated = await updateSource(sessionId, source.id, {
          settings: {
            deviceId: device.deviceId,
            deviceLabel: device.label || settings.deviceLabel,
            peerId,
            producerId,
            deviceAvailable: true,
          } satisfies CameraSourceSettings,
        })
        refreshed.push(updated)
      } catch {
        unavailableCameraLabels.push(device.label || settings.deviceLabel || source.name)
        const updated = await updateSource(sessionId, source.id, {
          settings: {
            ...settings,
            deviceId: device.deviceId,
            deviceLabel: device.label || settings.deviceLabel,
            peerId,
            deviceAvailable: false,
          } satisfies CameraSourceSettings,
        })
        refreshed.push(updated)
      }
      continue
    }

    if (source.type === 'prerecorded') {
      const settings = source.settings as PreRecordedSourceSettings
      if (settings.mediaUrl && playSource) {
        try {
          await playSource(source.id)
        } catch {
          // Leave in registry; host can retry play.
        }
      }
      refreshed.push(source)
      continue
    }

    // Screen: keep in registry/scene; host must re-share (no auto getDisplayMedia).
    refreshed.push(source)
  }

  // Merge refreshed into existing list
  const byId = new Map(existing.map((row) => [row.id, row]))
  for (const row of refreshed) byId.set(row.id, row)

  return {
    sources: [...byId.values()],
    scenes: await listScenes(sessionId),
    unavailableCameraLabels,
    skippedHostWebcamDuplicates,
  }
}
