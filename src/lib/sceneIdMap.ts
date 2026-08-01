const STORAGE_KEY = 'persistence-scene-id-map'

interface SessionSceneMap {
  compositorToPersistence: Record<string, string>
  persistenceToCompositor: Record<string, string>
  hydrated: boolean
}

type SceneMapStore = Record<string, SessionSceneMap>

function readStore(): SceneMapStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SceneMapStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: SceneMapStore): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getSessionMap(sessionId: string): SessionSceneMap {
  const store = readStore()
  return (
    store[sessionId] ?? {
      compositorToPersistence: {},
      persistenceToCompositor: {},
      hydrated: false,
    }
  )
}

function saveSessionMap(sessionId: string, map: SessionSceneMap): void {
  const store = readStore()
  store[sessionId] = map
  writeStore(store)
}

export function linkSceneIds(
  sessionId: string,
  compositorSceneId: string,
  persistenceSceneId: string,
): void {
  const map = getSessionMap(sessionId)
  map.compositorToPersistence[compositorSceneId] = persistenceSceneId
  map.persistenceToCompositor[persistenceSceneId] = compositorSceneId
  saveSessionMap(sessionId, map)
}

export function getPersistenceSceneId(sessionId: string, compositorSceneId: string): string | null {
  return getSessionMap(sessionId).compositorToPersistence[compositorSceneId] ?? null
}

export function getCompositorSceneId(sessionId: string, persistenceSceneId: string): string | null {
  return getSessionMap(sessionId).persistenceToCompositor[persistenceSceneId] ?? null
}

export function isSessionHydrated(sessionId: string): boolean {
  return getSessionMap(sessionId).hydrated
}

export function markSessionHydrated(sessionId: string): void {
  const map = getSessionMap(sessionId)
  map.hydrated = true
  saveSessionMap(sessionId, map)
}

export function unlinkCompositorScene(sessionId: string, compositorSceneId: string): void {
  const map = getSessionMap(sessionId)
  const persistenceId = map.compositorToPersistence[compositorSceneId]
  delete map.compositorToPersistence[compositorSceneId]
  if (persistenceId) delete map.persistenceToCompositor[persistenceId]
  saveSessionMap(sessionId, map)
}
