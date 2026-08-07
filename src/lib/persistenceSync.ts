import {
  createPersistedDestination,
  createPersistedScene,
  deletePersistedDestination,
  deletePersistedScene,
  updatePersistedDestination,
  updatePersistedScene,
  updateTenantConfiguration,
} from '@/api/persistence'
import { emptyGraphicsState, mergeGraphicsState } from '@/lib/graphics'
import { isPersistenceEnabled } from '@/lib/tenantEnv'
import {
  getPersistenceSceneId,
  linkSceneIds,
  unlinkCompositorScene,
} from '@/lib/sceneIdMap'
import type { DeviceSelection } from '@/types/devices'
import type { GraphicsState } from '@/types/graphics'
import type { LayoutType } from '@/types/session'
import type { BackgroundMusicConfig, Scene, UpdateSceneRequest } from '@/types/scenes'
import type { PersistedDestination, PersistedScene, TenantConfiguration } from '@/types/persistence'

let tenantId: string | null = null
let configuration: TenantConfiguration | null = null

export function initPersistenceRuntime(tenant_id: string, config: TenantConfiguration): void {
  tenantId = tenant_id
  configuration = config
}

export function getPersistenceTenantId(): string | null {
  return tenantId
}

export function getLocalTenantConfiguration(): TenantConfiguration | null {
  return configuration
}

export function replaceLocalTenantConfiguration(config: TenantConfiguration): void {
  configuration = config
}

function patchLocalConfiguration(partial: Partial<TenantConfiguration>): void {
  if (!configuration) return
  configuration = { ...configuration, ...partial }
}

function patchLocalScene(persistenceSceneId: string, partial: Partial<Scene>): void {
  if (!configuration) return
  configuration = {
    ...configuration,
    scenes: configuration.scenes.map((scene) =>
      scene.scene_id === persistenceSceneId ? { ...scene, ...partial, scene_id: persistenceSceneId } : scene,
    ),
  }
}

function appendLocalScene(scene: PersistedScene): void {
  if (!configuration) return
  configuration = {
    ...configuration,
    scenes: [...configuration.scenes, scene],
  }
}

function removeLocalScene(persistenceSceneId: string): void {
  if (!configuration) return
  configuration = {
    ...configuration,
    scenes: configuration.scenes.filter((scene) => scene.scene_id !== persistenceSceneId),
  }
}

function appendLocalDestination(destination: PersistedDestination): void {
  if (!configuration) return
  configuration = {
    ...configuration,
    destinations: [...configuration.destinations, destination],
  }
}

async function runPersist(label: string, fn: () => Promise<void>): Promise<void> {
  if (!isPersistenceEnabled() || !tenantId) return
  try {
    await fn()
  } catch (err) {
    console.warn(`[persistence] ${label} failed`, err)
  }
}

export async function persistConfiguration(
  partial: Parameters<typeof updateTenantConfiguration>[1],
): Promise<void> {
  if (!tenantId) return
  await runPersist('update configuration', async () => {
    const updated = await updateTenantConfiguration(tenantId!, partial)
    replaceLocalTenantConfiguration(updated)
  })
}

export async function persistLayout(layout: LayoutType): Promise<void> {
  patchLocalConfiguration({ layout })
  await persistConfiguration({ layout })
}

export async function persistGraphics(
  graphics_config: Partial<GraphicsState>,
  sessionId?: string | null,
  compositorSceneId?: string | null,
): Promise<void> {
  if (!configuration || !sessionId || !compositorSceneId) return

  const persistenceSceneId = getPersistenceSceneId(sessionId, compositorSceneId)
  if (!persistenceSceneId) return

  const persistedScene = configuration.scenes.find((scene) => scene.scene_id === persistenceSceneId)
  const mergedGraphics = mergeGraphicsState(
    mergeGraphicsState(emptyGraphicsState(), persistedScene?.graphics_config ?? {}),
    graphics_config,
  )

  patchLocalScene(persistenceSceneId, { graphics_config: mergedGraphics })

  await runPersist('update scene graphics', async () => {
    await updatePersistedScene(tenantId!, persistenceSceneId, { graphics_config })
  })
}

export async function persistDevices(devices: Partial<DeviceSelection>): Promise<void> {
  if (!configuration) return
  patchLocalConfiguration({
    devices: { ...configuration.devices, ...devices },
  })
  await persistConfiguration({ devices })
}

export async function persistTileOrder(tile_order_config: {
  version: number
  assignments: Record<string, string>
}): Promise<void> {
  patchLocalConfiguration({ tile_order_config })
  await persistConfiguration({ tile_order_config })
}

let currentSessionId: string | null = null

export function setPersistenceSessionId(sessionId: string | null): void {
  currentSessionId = sessionId
}

export async function persistActiveScene(compositorSceneId: string): Promise<void> {
  if (!tenantId || !currentSessionId) return
  const persistenceSceneId = getPersistenceSceneId(currentSessionId, compositorSceneId)
  if (!persistenceSceneId) return

  patchLocalConfiguration({ active_scene_id: persistenceSceneId })
  await persistConfiguration({ active_scene_id: persistenceSceneId })
}

export async function ensureSceneLinked(sessionId: string, compositorScene: Scene): Promise<void> {
  if (!tenantId) return
  if (getPersistenceSceneId(sessionId, compositorScene.scene_id)) return

  if (compositorScene.type === 'COUNTDOWN' && compositorScene.countdown?.target_scene_id) {
    await persistSceneCreate(sessionId, compositorScene, {
      type: 'COUNTDOWN',
      name: compositorScene.name,
      duration_seconds: compositorScene.countdown.duration_seconds,
      target_scene_id: compositorScene.countdown.target_scene_id,
    })
    return
  }

  await persistSceneCreate(sessionId, compositorScene, {
    type: 'CAMERA',
    name: compositorScene.name,
    devices: compositorScene.devices,
    layout: compositorScene.layout || undefined,
    graphics_config: compositorScene.graphics_config,
  })

  await persistSceneUpdate(sessionId, compositorScene.scene_id, {
    sources: compositorScene.sources,
    background_music: compositorScene.background_music,
  })
}

export async function ensureAllScenesLinked(sessionId: string, scenes: Scene[]): Promise<void> {
  for (const scene of scenes) {
    await ensureSceneLinked(sessionId, scene)
  }
}

export async function persistSceneCreate(
  sessionId: string,
  compositorScene: Scene,
  request: Parameters<typeof createPersistedScene>[1] & { graphics_config?: Scene['graphics_config'] },
): Promise<string | null> {
  if (!tenantId) return null

  let persistenceSceneId: string | null = null
  await runPersist('create scene', async () => {
    const body = { ...request }
    if (body.type === 'COUNTDOWN' && body.target_scene_id) {
      const mappedTarget = getPersistenceSceneId(sessionId, body.target_scene_id)
      if (mappedTarget) body.target_scene_id = mappedTarget
    }

    const persisted = await createPersistedScene(tenantId!, body)
    persistenceSceneId = persisted.scene_id
    linkSceneIds(sessionId, compositorScene.scene_id, persisted.scene_id)
    appendLocalScene({
      scene_id: persisted.scene_id,
      tenant_id: tenantId!,
      name: compositorScene.name,
      type: compositorScene.type,
      sort_order: compositorScene.sort_order,
      layout: compositorScene.layout,
      graphics_config: compositorScene.graphics_config,
      devices: compositorScene.devices,
      sources: compositorScene.sources,
      background_music: compositorScene.background_music,
      countdown: compositorScene.countdown,
      is_active: compositorScene.is_active,
      created_at: compositorScene.created_at,
      updated_at: compositorScene.updated_at,
    })
  })
  return persistenceSceneId
}

export async function persistSceneUpdate(
  sessionId: string,
  compositorSceneId: string,
  body: UpdateSceneRequest,
): Promise<void> {
  if (!tenantId) return
  const persistenceSceneId = getPersistenceSceneId(sessionId, compositorSceneId)
  if (!persistenceSceneId) return

  patchLocalScene(persistenceSceneId, body as Partial<Scene>)
  await runPersist('update scene', async () => {
    await updatePersistedScene(tenantId!, persistenceSceneId, body)
  })
}

export async function persistSceneDelete(
  sessionId: string,
  compositorSceneId: string,
): Promise<void> {
  if (!tenantId) return
  const persistenceSceneId = getPersistenceSceneId(sessionId, compositorSceneId)
  if (!persistenceSceneId) return

  removeLocalScene(persistenceSceneId)
  unlinkCompositorScene(sessionId, compositorSceneId)
  await runPersist('delete scene', async () => {
    await deletePersistedScene(tenantId!, persistenceSceneId)
  })
}

export async function persistSceneSources(
  sessionId: string,
  compositorSceneId: string,
  sources:
    | Record<string, string>
    | {
        version?: number
        items?: unknown[]
        assignments?: Record<string, string>
        sources?: unknown[]
      },
): Promise<void> {
  // Tile-order callers pass a slot→sourceId map; Sources panel passes full config.
  const payload =
    sources &&
    typeof sources === 'object' &&
    ('version' in sources || 'items' in sources)
      ? sources
      : { assignments: sources as Record<string, string> }

  await persistSceneUpdate(sessionId, compositorSceneId, {
    sources: payload,
  })
}

export async function persistBackgroundMusic(
  sessionId: string,
  compositorSceneId: string,
  background_music: BackgroundMusicConfig,
): Promise<void> {
  await persistSceneUpdate(sessionId, compositorSceneId, { background_music })
}

export async function persistDestinationsFromStream(
  destinations: { url: string; label?: string }[],
): Promise<void> {
  if (!tenantId) return

  await runPersist('save stream destinations', async () => {
    for (const destination of destinations) {
      const label = destination.label?.trim() || 'Custom'
      const platform = label.toLowerCase()
      const existing = configuration?.destinations.find(
        (item) => item.url === destination.url.trim(),
      )
      if (existing) {
        await updatePersistedDestination(tenantId!, existing.destination_id, {
          label,
          platform,
        })
        continue
      }
      const created = await createPersistedDestination(tenantId!, {
        url: destination.url.trim(),
        label,
        platform,
      })
      appendLocalDestination(created)
    }
  })
}

export async function persistDestinationUpsert(
  destination: { url: string; label?: string; platform?: string; destination_id?: string },
): Promise<void> {
  if (!tenantId) return

  await runPersist('upsert destination', async () => {
    if (destination.destination_id) {
      await updatePersistedDestination(tenantId!, destination.destination_id, {
        url: destination.url,
        label: destination.label,
        platform: destination.platform,
      })
      return
    }
    const created = await createPersistedDestination(tenantId!, {
      url: destination.url,
      label: destination.label,
      platform: destination.platform,
    })
    appendLocalDestination(created)
  })
}

export async function persistDestinationDelete(destinationId: string): Promise<void> {
  if (!tenantId || !configuration) return

  configuration = {
    ...configuration,
    destinations: configuration.destinations.filter(
      (item) => item.destination_id !== destinationId,
    ),
  }

  await runPersist('delete destination', async () => {
    await deletePersistedDestination(tenantId!, destinationId)
  })
}
