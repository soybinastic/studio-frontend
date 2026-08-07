import { activateScene, createScene, listScenes, updateScene } from '@/api/scenes'
import { updateGraphicsBulk } from '@/api/graphics'
import { updateLayout, updateSessionTileConfig } from '@/api/sessions'
import {
  hasNonNullGraphicsLayers,
} from '@/lib/graphics'
import {
  getCompositorSceneId,
  isSessionHydrated,
  linkSceneIds,
  markSessionHydrated,
} from '@/lib/sceneIdMap'
import {
  getCatalogFromSceneSources,
} from '@/lib/sourceCatalog'
import { assignmentsFromSceneItems, getSceneItems } from '@/types/sources'
import type { TenantConfiguration } from '@/types/persistence'
import type { LayoutType } from '@/types/session'
import type { SceneSourcesConfig } from '@/types/sources'
import type { UpdateSceneRequest } from '@/types/scenes'

/** Drop ghost SceneItems that lack a persisted Source catalog snapshot. */
function prepareSourcesForHydrate(
  config: SceneSourcesConfig | undefined,
): SceneSourcesConfig {
  if (!config) {
    return { version: 2, items: [], sources: [], assignments: {} }
  }
  const catalog = getCatalogFromSceneSources(config)
  if (catalog.length === 0) {
    return { version: 2, items: [], sources: [], assignments: {} }
  }
  const catalogIds = new Set(catalog.map((row) => row.sourceId))
  const items = getSceneItems(config).filter((item) => catalogIds.has(item.sourceId))
  return {
    version: 2,
    items,
    sources: catalog,
    assignments: assignmentsFromSceneItems(items),
  }
}

export async function hydrateCompositorFromPersistence(
  sessionId: string,
  config: TenantConfiguration,
): Promise<void> {
  if (isSessionHydrated(sessionId)) return

  const tenantHasGraphics = hasNonNullGraphicsLayers(config.graphics_config)
  const sceneHasGraphics = config.scenes.some((scene) =>
    hasNonNullGraphicsLayers(scene.graphics_config),
  )
  const hasPersistedData =
    config.scenes.length > 0 ||
    config.layout !== 'CONTAIN' ||
    tenantHasGraphics ||
    sceneHasGraphics

  if (!hasPersistedData) {
    markSessionHydrated(sessionId)
    return
  }

  if (config.layout) {
    await updateLayout(sessionId, config.layout as LayoutType)
  }

  if (config.tile_order_config) {
    await updateSessionTileConfig(sessionId, {
      tile_order_config: config.tile_order_config,
    })
  }

  let compositorScenes = await listScenes(sessionId)

  const cameraScenes = config.scenes
    .filter((scene) => scene.type === 'CAMERA')
    .sort((a, b) => a.sort_order - b.sort_order)

  for (let index = 0; index < cameraScenes.length; index++) {
    const persisted = cameraScenes[index]
    const compositorCandidates = compositorScenes
      .filter((scene) => scene.type === 'CAMERA')
      .sort((a, b) => a.sort_order - b.sort_order)
    let compositor = compositorCandidates[index]

    const sceneGraphics = persisted.graphics_config

    const scenePatch: UpdateSceneRequest = {
      name: persisted.name,
      layout: persisted.layout || undefined,
      devices: persisted.devices,
      sources: prepareSourcesForHydrate(persisted.sources),
      background_music: persisted.background_music,
    }
    if (hasNonNullGraphicsLayers(sceneGraphics)) {
      scenePatch.graphics_config = sceneGraphics
    }

    if (compositor) {
      compositor = await updateScene(sessionId, compositor.scene_id, scenePatch)
    } else {
      compositor = await createScene(sessionId, {
        type: 'CAMERA',
        devices: persisted.devices,
        layout: (persisted.layout || config.layout || 'CONTAIN') as LayoutType,
      })
      compositor = await updateScene(sessionId, compositor.scene_id, scenePatch)
    }

    linkSceneIds(sessionId, compositor.scene_id, persisted.scene_id)
  }

  compositorScenes = await listScenes(sessionId)

  const countdownScenes = config.scenes
    .filter((scene) => scene.type === 'COUNTDOWN')
    .sort((a, b) => a.sort_order - b.sort_order)

  for (const persisted of countdownScenes) {
    const targetPersistenceId = persisted.countdown?.target_scene_id
    const targetCompositorId = targetPersistenceId
      ? getCompositorSceneId(sessionId, targetPersistenceId)
      : null
    if (!targetCompositorId || !persisted.countdown) continue

    const existingCompositorId = getCompositorSceneId(sessionId, persisted.scene_id)
    const existing = existingCompositorId
      ? compositorScenes.find((scene) => scene.scene_id === existingCompositorId)
      : undefined

    const compositor =
      existing ??
      (await createScene(sessionId, {
        type: 'COUNTDOWN',
        duration_seconds: persisted.countdown.duration_seconds,
        target_scene_id: targetCompositorId,
      }))

    if (existing && persisted.name !== compositor.name) {
      await updateScene(sessionId, compositor.scene_id, { name: persisted.name })
    }

    linkSceneIds(sessionId, compositor.scene_id, persisted.scene_id)
  }

  if (config.active_scene_id) {
    const compositorActiveId = getCompositorSceneId(sessionId, config.active_scene_id)
    if (compositorActiveId) {
      await activateScene(sessionId, compositorActiveId)
    }
  } else if (config.scenes.length === 0 && tenantHasGraphics) {
    await updateGraphicsBulk(sessionId, config.graphics_config)
  }

  markSessionHydrated(sessionId)
}
