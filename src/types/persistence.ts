import type { DeviceSelection } from '@/types/devices'
import type { BannerGraphic, GraphicsState, TickerGraphic } from '@/types/graphics'
import type { LayoutType } from '@/types/session'
import type {
  BackgroundMusicConfig,
  SceneCountdownConfig,
  SceneSourcesConfig,
  SceneType,
} from '@/types/scenes'

export interface TenantConfiguration {
  layout: LayoutType
  tile_order_config: { version: number; assignments: Record<string, string> }
  active_scene_id: string | null
  devices: DeviceSelection
  graphics_config: Partial<GraphicsState>
  scenes: PersistedScene[]
  destinations: PersistedDestination[]
  platform_connections?: PersistedPlatformConnection[]
  asset_catalog: AssetCatalog
  text_material_catalog: TextMaterialCatalog
  music_catalog?: TenantMusicTrack[]
}

/** Legacy CMS asset type codes from studio-persistence. */
export type StudioAssetType = 1 | 2 | 4 | 5 | 6

export type StudioMediaFormat = 'image' | 'video'

export interface StudioMediaAsset {
  asset_id: string
  tenant_id: string | null
  asset_type: StudioAssetType
  source: string
  thumbnail: string | null
  size: number
  media_format: StudioMediaFormat
  label: string
  is_system_default: boolean
  is_active: boolean
  meta_data: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TenantMusicTrack {
  track_id: string
  tenant_id: string | null
  title: string
  source: string
  size: number
  is_system_default: boolean
  is_active: boolean
  meta_data: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AssetCatalog {
  backgrounds: StudioMediaAsset[]
  background_videos: StudioMediaAsset[]
  overlays: StudioMediaAsset[]
  logos: StudioMediaAsset[]
  green_screens: StudioMediaAsset[]
  qr_codes: StudioMediaAsset[]
}

export interface BannerMaterial {
  material_id: string
  tenant_id: string | null
  label: string
  is_system_default: boolean
  is_active: boolean
  sort_order: number
  banner: BannerGraphic
  created_at: string
  updated_at: string
}

export interface TickerMaterial {
  material_id: string
  tenant_id: string | null
  label: string
  is_system_default: boolean
  is_active: boolean
  sort_order: number
  ticker: TickerGraphic
  created_at: string
  updated_at: string
}

export interface TextMaterialCatalog {
  banners: BannerMaterial[]
  tickers: TickerMaterial[]
}

export interface PersistedScene {
  scene_id: string
  tenant_id: string
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

export interface PersistedDestination {
  destination_id: string
  tenant_id: string
  label: string
  url: string
  platform: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PersistedPlatformConnection {
  connection_id: string
  tenant_id: string
  platform: string
  name: string
  status: string
  platform_user_id: string
  platform_login: string
  destination_id: string | null
  has_stream_key: boolean
  metadata: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TenantBootstrapResponse {
  tenant_id: string
  tenant_name: string
  created: boolean
  configuration: TenantConfiguration
}
