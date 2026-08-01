import type { LayoutType } from '@/types/session'
import type {
  BackgroundGraphic,
  BannerGraphic,
  GraphicsState,
  LogoGraphic,
  OverlayGraphic,
  QrGraphic,
  TickerGraphic,
} from '@/types/graphics'

/** Matches compositor-backend apps/graphics/constants.py */
export const BACKGROUND_VISIBLE_LAYOUTS: readonly LayoutType[] = ['CONTAIN', 'FULLSCREEN']

export function resolveGraphicUrl(config: { url?: string; source?: string } | null | undefined): string {
  if (!config) return ''
  return (config.url?.trim() || config.source?.trim() || '')
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url)
}

export function backgroundShouldShow(
  config: BackgroundGraphic | null | undefined,
  layout: LayoutType,
): boolean {
  if (!BACKGROUND_VISIBLE_LAYOUTS.includes(layout)) return false
  if (!config?.is_active) return false
  return Boolean(resolveGraphicUrl(config))
}

export function logoShouldShow(config: LogoGraphic | null | undefined): boolean {
  if (!config?.is_active) return false
  return Boolean(resolveGraphicUrl(config))
}

export function overlayShouldShow(config: OverlayGraphic | null | undefined): boolean {
  if (!config?.is_active) return false
  return Boolean(resolveGraphicUrl(config))
}

export function qrShouldShow(config: QrGraphic | null | undefined): boolean {
  if (!config?.is_shown) return false
  return Boolean(resolveGraphicUrl(config))
}

export function bannerShouldShow(config: BannerGraphic | null | undefined): boolean {
  if (!config?.is_display) return false
  return Boolean(config.title?.trim() || config.description?.trim())
}

export function tickerShouldShow(config: TickerGraphic | null | undefined): boolean {
  if (!config?.tickerEnabled) return false
  return Boolean(config.tickerText?.trim())
}

export function layoutSupportsBackground(layout: LayoutType): boolean {
  return BACKGROUND_VISIBLE_LAYOUTS.includes(layout)
}

export function emptyGraphicsState(): GraphicsState {
  return {
    background: null,
    overlay: null,
    logo: null,
    qr: null,
    banner: null,
    ticker: null,
    chat: null,
  }
}

export function mergeGraphicsState(base: GraphicsState | null, patch: Partial<GraphicsState>): GraphicsState {
  return { ...emptyGraphicsState(), ...base, ...patch }
}

/** True when at least one graphics layer is explicitly set (not null/undefined). */
export function hasNonNullGraphicsLayers(state: Partial<GraphicsState> | null | undefined): boolean {
  if (!state) return false
  return Object.values(state).some((value) => value != null)
}

/**
 * Merge scene + tenant graphics for hydration. Tenant-level edits (sidebar)
 * win over stale scene snapshots when both define a layer.
 */
export function mergePersistedSceneGraphics(
  sceneGraphics: Partial<GraphicsState> | null | undefined,
  tenantGraphics: Partial<GraphicsState> | null | undefined,
): Partial<GraphicsState> {
  const fromScene = mergeGraphicsState(emptyGraphicsState(), sceneGraphics ?? {})
  const tenantPatch = Object.fromEntries(
    Object.entries(tenantGraphics ?? {}).filter(([, value]) => value != null),
  ) as Partial<GraphicsState>
  return mergeGraphicsState(fromScene, tenantPatch)
}
