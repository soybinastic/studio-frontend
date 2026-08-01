import { persistenceRequest } from '@/api/persistenceClient'
import type { DeviceSelection } from '@/types/devices'
import type { GraphicsState } from '@/types/graphics'
import type { LayoutType } from '@/types/session'
import type {
  BackgroundMusicConfig,
  CreateSceneRequest,
  SceneSourcesConfig,
  UpdateSceneRequest,
} from '@/types/scenes'
import type {
  AssetCatalog,
  BannerMaterial,
  PersistedDestination,
  PersistedScene,
  TenantBootstrapResponse,
  TenantConfiguration,
  TextMaterialCatalog,
  TickerMaterial,
} from '@/types/persistence'

export function bootstrapTenant(tenantId: string, tenantName: string) {
  return persistenceRequest<TenantBootstrapResponse>('/tenant', {
    method: 'POST',
    body: JSON.stringify({ tenant_id: tenantId, tenant_name: tenantName }),
  })
}

export function getTenantConfiguration(tenantId: string) {
  return persistenceRequest<TenantConfiguration>(`/tenant/${tenantId}/configuration/`)
}

export function updateTenantConfiguration(
  tenantId: string,
  body: {
    layout?: LayoutType
    tile_order_config?: { version: number; assignments: Record<string, string> }
    devices?: Partial<DeviceSelection>
    graphics_config?: Partial<GraphicsState>
    active_scene_id?: string | null
  },
) {
  return persistenceRequest<TenantConfiguration>(`/tenant/${tenantId}/configuration/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function listPersistedScenes(tenantId: string) {
  return persistenceRequest<PersistedScene[]>(`/tenant/${tenantId}/scenes/`)
}

export function createPersistedScene(
  tenantId: string,
  body: CreateSceneRequest & { name?: string; graphics_config?: Partial<GraphicsState> },
) {
  return persistenceRequest<PersistedScene>(`/tenant/${tenantId}/scenes/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updatePersistedScene(
  tenantId: string,
  sceneId: string,
  body: UpdateSceneRequest & { sort_order?: number },
) {
  return persistenceRequest<PersistedScene>(`/tenant/${tenantId}/scenes/${sceneId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deletePersistedScene(tenantId: string, sceneId: string) {
  return persistenceRequest<void>(`/tenant/${tenantId}/scenes/${sceneId}/`, {
    method: 'DELETE',
  })
}

export function listPersistedDestinations(tenantId: string) {
  return persistenceRequest<PersistedDestination[]>(`/tenant/${tenantId}/destinations/`)
}

export function createPersistedDestination(
  tenantId: string,
  body: { url: string; label?: string; platform?: string },
) {
  return persistenceRequest<PersistedDestination>(`/tenant/${tenantId}/destinations/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updatePersistedDestination(
  tenantId: string,
  destinationId: string,
  body: { url?: string; label?: string; platform?: string; sort_order?: number },
) {
  return persistenceRequest<PersistedDestination>(
    `/tenant/${tenantId}/destinations/${destinationId}/`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export function deletePersistedDestination(tenantId: string, destinationId: string) {
  return persistenceRequest<void>(`/tenant/${tenantId}/destinations/${destinationId}/`, {
    method: 'DELETE',
  })
}

export function getTenantAssetCatalog(tenantId: string) {
  return persistenceRequest<AssetCatalog>(`/tenant/${tenantId}/assets/`)
}

export function getTenantTextMaterialCatalog(tenantId: string) {
  return persistenceRequest<TextMaterialCatalog>(`/tenant/${tenantId}/text-materials/`)
}

export function createBannerMaterial(
  tenantId: string,
  body: {
    label?: string
    title: string
    description?: string
    theme?: string
    primary?: string
    secondary?: string
    accent?: string
    font_size?: number
    is_display_names?: boolean
  },
) {
  return persistenceRequest<BannerMaterial>(`/tenant/${tenantId}/banners/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createTickerMaterial(
  tenantId: string,
  body: {
    label?: string
    ticker_text: string
    ticker_position?: 'top' | 'bottom'
    ticker_direction?: 'rtl' | 'ltr'
    ticker_speed?: number
    primary?: string
    secondary?: string
  },
) {
  return persistenceRequest<TickerMaterial>(`/tenant/${tenantId}/tickers/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type { SceneSourcesConfig, BackgroundMusicConfig }
