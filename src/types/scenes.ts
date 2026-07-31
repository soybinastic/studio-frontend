import type { DeviceSelection } from '@/types/devices'
import type { GraphicsState } from '@/types/graphics'
import type { LayoutType } from '@/types/session'

export type SceneType = 'CAMERA' | 'COUNTDOWN'

export interface SceneSourcesConfig {
  version: 1
  sources: unknown[]
}

export interface BackgroundMusicConfig {
  version: 1
  enabled: boolean
  track: { url: string; title?: string } | null
  volume: number
  loop: boolean
}

export interface SceneCountdownConfig {
  duration_seconds: number
  target_scene_id: string | null
}

export interface Scene {
  scene_id: string
  session_id: string
  name: string
  type: SceneType
  sort_order: number
  layout: LayoutType | ''
  graphics_config: Partial<GraphicsState>
  devices: DeviceSelection
  sources: SceneSourcesConfig
  background_music: BackgroundMusicConfig
  countdown: SceneCountdownConfig | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SceneCameraActivateResponse {
  activation_type: 'camera'
  scene: Scene
  layout: LayoutType
  graphics_config: Partial<GraphicsState>
  devices: DeviceSelection
}

export interface SceneCountdownActivateResponse {
  activation_type: 'countdown'
  scene: Scene
  countdown_state: {
    active: boolean
    started_at: string
    duration_seconds: number
    target_scene_id: string
    source_scene_id: string
  }
}

export type SceneActivateResponse = SceneCameraActivateResponse | SceneCountdownActivateResponse

export interface CreateCameraSceneRequest {
  type: 'CAMERA'
  devices?: Partial<DeviceSelection>
  layout?: LayoutType
}

export interface CreateCountdownSceneRequest {
  type: 'COUNTDOWN'
  duration_seconds: number
  target_scene_id: string
}

export type CreateSceneRequest = CreateCameraSceneRequest | CreateCountdownSceneRequest

export interface UpdateSceneRequest {
  name?: string
  layout?: LayoutType
  graphics_config?: Partial<GraphicsState>
  devices?: Partial<DeviceSelection>
}
