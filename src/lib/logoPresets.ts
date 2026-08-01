import type { LogoGraphic, LogoPlacement } from '@/types/graphics'

export interface LogoPreset {
  id: string
  label: string
  url: string
  thumbnail?: string
}

export const LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'play-broadcast',
    label: 'Play broadcast',
    url: 'https://studio-assets.b-cdn.net/logo/e4eb5471-9761-4ff5-b898-a362134ac416.png',
  },
  {
    id: 'abstract-circle',
    label: 'Abstract circle',
    url: 'https://static.vecteezy.com/system/resources/thumbnails/012/986/755/small_2x/abstract-circle-logo-icon-free-png.png',
  },
  {
    id: 'superman',
    label: 'Superman',
    url: 'https://thumbs.dreamstime.com/b/best-quality-illustration-famous-superman-logo-isolated-transparent-background-high-detailed-original-version-104743115.jpg',
  },
]

export const LOGO_PLACEMENTS: readonly LogoPlacement[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

export const DEFAULT_LOGO_PLACEMENT: LogoPlacement = 'top-right'

export function normalizeLogoPlacement(value: unknown): LogoPlacement {
  const key = String(value ?? DEFAULT_LOGO_PLACEMENT).toLowerCase().replace(/_/g, '-')
  if (key === 'topleft' || key === 'top-left') return 'top-left'
  if (key === 'bottomleft' || key === 'bottom-left') return 'bottom-left'
  if (key === 'bottomright' || key === 'bottom-right') return 'bottom-right'
  return 'top-right'
}

export function getLogoPlacement(logo: LogoGraphic | null | undefined): LogoPlacement {
  if (!logo) return DEFAULT_LOGO_PLACEMENT
  return normalizeLogoPlacement(logo.placement || logo.logoPosition || logo.position)
}

export function buildLogoGraphic(
  url: string,
  placement: LogoPlacement = DEFAULT_LOGO_PLACEMENT,
): LogoGraphic {
  return {
    url,
    is_active: true,
    placement,
  }
}
