import { apiRequest } from '@/api/client'
import type {
  CreateSceneRequest,
  Scene,
  SceneActivateResponse,
  UpdateSceneRequest,
} from '@/types/scenes'

export function listScenes(sessionId: string) {
  return apiRequest<Scene[]>(`/sessions/${sessionId}/scenes/`)
}

export function createScene(sessionId: string, body: CreateSceneRequest) {
  return apiRequest<Scene>(`/sessions/${sessionId}/scenes/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateScene(sessionId: string, sceneId: string, body: UpdateSceneRequest) {
  return apiRequest<Scene>(`/sessions/${sessionId}/scenes/${sceneId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteScene(sessionId: string, sceneId: string) {
  return apiRequest<void>(`/sessions/${sessionId}/scenes/${sceneId}/`, {
    method: 'DELETE',
  })
}

export function activateScene(sessionId: string, sceneId: string) {
  return apiRequest<SceneActivateResponse>(
    `/sessions/${sessionId}/scenes/${sceneId}/activate/`,
    { method: 'POST' },
  )
}
