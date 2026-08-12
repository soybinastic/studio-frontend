import { apiRequest } from '@/api/client'
import type {
  CreateSourceRequest,
  SceneSourcesConfig,
  Source,
  SourcePlaybackRequest,
  SourceState,
  SourceType,
  UpdateSourceRequest,
} from '@/types/sources'

/** Raw compositor payload — uses `source_id` instead of `id`. */
interface ApiSource {
  source_id: string
  session_id: string
  type: SourceType
  name: string
  state: SourceState
  volume: number
  muted: boolean
  settings: Source['settings']
  created_at?: string
  updated_at?: string
}

function normalizeSource(raw: ApiSource): Source {
  return {
    id: raw.source_id,
    type: raw.type,
    name: raw.name,
    state: raw.state,
    volume: raw.volume,
    muted: raw.muted,
    settings: raw.settings ?? {},
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

export function listSources(sessionId: string) {
  return apiRequest<ApiSource[]>(`/sessions/${sessionId}/sources/`).then((rows) =>
    rows.map(normalizeSource),
  )
}

export function createSource(sessionId: string, body: CreateSourceRequest) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(normalizeSource)
}

export function updateSource(sessionId: string, sourceId: string, body: UpdateSourceRequest) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/${sourceId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(normalizeSource)
}

export function deleteSource(sessionId: string, sourceId: string) {
  return apiRequest<void>(`/sessions/${sessionId}/sources/${sourceId}/`, {
    method: 'DELETE',
  })
}

export function playSource(sessionId: string, sourceId: string, body?: SourcePlaybackRequest) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/${sourceId}/play/`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  }).then(normalizeSource)
}

export function pauseSource(sessionId: string, sourceId: string) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/${sourceId}/pause/`, {
    method: 'POST',
    body: JSON.stringify({}),
  }).then(normalizeSource)
}

export function stopSource(sessionId: string, sourceId: string) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/${sourceId}/stop/`, {
    method: 'POST',
    body: JSON.stringify({}),
  }).then(normalizeSource)
}

export function seekSource(sessionId: string, sourceId: string, positionMs: number) {
  return apiRequest<ApiSource>(`/sessions/${sessionId}/sources/${sourceId}/seek/`, {
    method: 'POST',
    body: JSON.stringify({ position_ms: positionMs }),
  }).then(normalizeSource)
}

export function attachSourceToScene(
  sessionId: string,
  sceneId: string,
  body: { source_id: string; visible?: boolean },
) {
  return apiRequest<SceneSourcesConfig>(
    `/sessions/${sessionId}/scenes/${sceneId}/sources/attach/`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

export function detachSourceFromScene(sessionId: string, sceneId: string, sourceId: string) {
  return apiRequest<SceneSourcesConfig>(
    `/sessions/${sessionId}/scenes/${sceneId}/sources/${sourceId}/`,
    { method: 'DELETE' },
  )
}

export function setSceneSourceVisibility(
  sessionId: string,
  sceneId: string,
  sourceId: string,
  visible: boolean,
) {
  return apiRequest<SceneSourcesConfig>(
    `/sessions/${sessionId}/scenes/${sceneId}/sources/${sourceId}/visibility/`,
    {
      method: 'PATCH',
      body: JSON.stringify({ visible }),
    },
  )
}

export function reorderSceneSources(
  sessionId: string,
  sceneId: string,
  sourceIds: string[],
) {
  return apiRequest<SceneSourcesConfig>(
    `/sessions/${sessionId}/scenes/${sceneId}/sources/reorder/`,
    {
      method: 'POST',
      body: JSON.stringify({ source_ids: sourceIds }),
    },
  )
}
