import type { LayoutType } from '@/types/session'
import type {
  BackgroundGraphic,
  BannerGraphic,
  ChatGraphic,
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

export function chatShouldShow(config: ChatGraphic | null | undefined): boolean {
  return Boolean(config?.enabled)
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
    fonts: null,
  }
}

export function mergeGraphicsState(base: GraphicsState | null, patch: Partial<GraphicsState>): GraphicsState {
  const merged = { ...emptyGraphicsState(), ...base, ...patch }
  const alias = (patch as { fontFamily?: string | null }).fontFamily
  if (alias != null && patch.fonts === undefined) {
    merged.fonts = String(alias)
  }
  return merged
}

const LAYER_KEYS = [
  'background',
  'overlay',
  'logo',
  'qr',
  'banner',
  'ticker',
  'chat',
] as const

/** True when at least one graphics layer is explicitly set (not null/undefined). */
export function hasNonNullGraphicsLayers(state: Partial<GraphicsState> | null | undefined): boolean {
  if (!state) return false
  return LAYER_KEYS.some((key) => state[key] != null) || Boolean(state.fonts)
}
