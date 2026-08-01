import { BACKGROUND_PRESETS, type BackgroundPreset } from '@/lib/backgroundPresets'
import { LOGO_PRESETS, type LogoPreset } from '@/lib/logoPresets'
import { OVERLAY_PRESETS, type OverlayPreset } from '@/lib/overlayPresets'
import { QR_PRESETS, type QrPreset } from '@/lib/qrPresets'
import { normalizeQrPlacement, qrDimensionsForPlacement } from '@/lib/qrGeometry'
import type { QrGraphic } from '@/types/graphics'
import type { AssetCatalog, StudioMediaAsset } from '@/types/persistence'

export interface QrCatalogPreset extends QrPreset {
  meta_data?: Record<string, unknown>
}

function activeAssets(assets: StudioMediaAsset[] | undefined): StudioMediaAsset[] {
  return (assets ?? [])
    .filter((asset) => asset.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
}

function previewUrl(asset: StudioMediaAsset): string {
  return asset.thumbnail?.trim() || asset.source
}

export function toBackgroundPreset(asset: StudioMediaAsset): BackgroundPreset {
  return {
    id: asset.asset_id,
    label: asset.label,
    url: asset.source,
    type: asset.media_format === 'video' ? 'video' : 'image',
    thumbnail: previewUrl(asset),
  }
}

export function toOverlayPreset(asset: StudioMediaAsset): OverlayPreset {
  return {
    id: asset.asset_id,
    label: asset.label,
    url: asset.source,
    thumbnail: previewUrl(asset),
  }
}

export function toLogoPreset(asset: StudioMediaAsset): LogoPreset {
  return {
    id: asset.asset_id,
    label: asset.label,
    url: asset.source,
    thumbnail: previewUrl(asset),
  }
}

export function toQrPreset(asset: StudioMediaAsset): QrCatalogPreset {
  return {
    id: asset.asset_id,
    label: asset.label,
    url: asset.source,
    thumbnail: previewUrl(asset),
    meta_data: asset.meta_data,
  }
}

function useCatalogOrFallback<T>(
  catalogItems: T[],
  fallback: T[],
): T[] {
  return catalogItems.length > 0 ? catalogItems : fallback
}

export function backgroundPresetsFromCatalog(
  catalog: AssetCatalog | null | undefined,
): BackgroundPreset[] {
  if (!catalog) return BACKGROUND_PRESETS

  const fromCatalog = [
    ...activeAssets(catalog.backgrounds).map(toBackgroundPreset),
    ...activeAssets(catalog.background_videos).map(toBackgroundPreset),
  ]

  return useCatalogOrFallback(fromCatalog, BACKGROUND_PRESETS)
}

export function overlayPresetsFromCatalog(
  catalog: AssetCatalog | null | undefined,
): OverlayPreset[] {
  if (!catalog) return OVERLAY_PRESETS
  const fromCatalog = activeAssets(catalog.overlays).map(toOverlayPreset)
  return useCatalogOrFallback(fromCatalog, OVERLAY_PRESETS)
}

export function logoPresetsFromCatalog(
  catalog: AssetCatalog | null | undefined,
): LogoPreset[] {
  if (!catalog) return LOGO_PRESETS
  const fromCatalog = activeAssets(catalog.logos).map(toLogoPreset)
  return useCatalogOrFallback(fromCatalog, LOGO_PRESETS)
}

export function qrPresetsFromCatalog(
  catalog: AssetCatalog | null | undefined,
): QrCatalogPreset[] {
  if (!catalog) return QR_PRESETS
  const fromCatalog = activeAssets(catalog.qr_codes).map(toQrPreset)
  return useCatalogOrFallback(fromCatalog, QR_PRESETS)
}

export function buildQrGraphicFromCatalogPreset(
  preset: QrCatalogPreset,
  existing?: QrGraphic | null,
): QrGraphic {
  const meta = preset.meta_data ?? {}
  const placement = normalizeQrPlacement(meta.position ?? existing?.position)
  const dimensions = qrDimensionsForPlacement(placement)

  return {
    url: preset.url,
    source: preset.url,
    is_shown: meta.is_shown !== false,
    position: placement,
    title: String(meta.title ?? existing?.title ?? 'Scan me'),
    primary: String(meta.title_color ?? meta.url_color ?? existing?.primary ?? '#ffffff'),
    secondary: String(meta.background_color ?? existing?.secondary ?? '#000000'),
    ...dimensions,
  }
}
