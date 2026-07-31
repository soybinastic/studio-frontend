import type { CSSProperties } from 'react'
import type { BannerGraphic, BannerThemeStyle } from '@/types/graphics'

export interface BannerThemeMeta {
  id: BannerThemeStyle
  label: string
  description: string
}

export const BANNER_THEME_STYLES: BannerThemeMeta[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Left accent bar + solid background',
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Rounded rectangle',
  },
  {
    id: 'bracket',
    label: 'Bracket',
    description: 'Accent bars on left and right',
  },
  {
    id: 'outlined',
    label: 'Outlined',
    description: 'Semi-transparent fill with colored border',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Plain rectangular box',
  },
  {
    id: 'pill',
    label: 'Pill',
    description: 'Fully rounded capsule shape',
  },
]

export const DEFAULT_BANNER_ACCENT = '#38bdf8'

export const DEFAULT_BRAND_COLORS = {
  primary: '#111111',
  secondary: '#374151',
  accent: DEFAULT_BANNER_ACCENT,
} as const

/** Map legacy backend theme values to the current style set. */
export function normalizeBannerTheme(theme: string | undefined): BannerThemeStyle {
  switch (theme) {
    case 'default':
    case 'accent':
      return 'default'
    case 'rounded':
      return 'rounded'
    case 'bracket':
      return 'bracket'
    case 'outlined':
      return 'outlined'
    case 'pill':
      return 'pill'
    case 'classic':
    case 'plain':
    default:
      return 'classic'
  }
}

export function resolveBannerAccent(banner: BannerGraphic): string {
  return banner.accent?.trim() || DEFAULT_BANNER_ACCENT
}

export function resolveBannerBrandColors(banner: BannerGraphic) {
  return {
    primary: banner.primary || DEFAULT_BRAND_COLORS.primary,
    secondary: banner.secondary || DEFAULT_BRAND_COLORS.secondary,
    accent: resolveBannerAccent(banner),
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const value = hex.trim().replace('#', '')
  if (value.length !== 6) return null
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null
  return { r, g, b }
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function pickTextColor(backgroundHex: string): string {
  const rgb = hexToRgb(backgroundHex)
  if (!rgb) return '#ffffff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.6 ? '#111111' : '#ffffff'
}

export function bannerShapeClassName(theme: BannerThemeStyle): string {
  switch (theme) {
    case 'rounded':
      return 'rounded-lg'
    case 'pill':
      return 'rounded-full'
    default:
      return ''
  }
}

export function bannerBarStyle(
  theme: BannerThemeStyle,
  role: 'title' | 'description',
  colors: ReturnType<typeof resolveBannerBrandColors>,
): CSSProperties {
  const background = role === 'title' ? colors.primary : colors.secondary
  const textColor = pickTextColor(background)

  switch (theme) {
    case 'default':
      return {
        backgroundColor: background,
        color: textColor,
        borderLeft: `4px solid ${colors.accent}`,
      }
    case 'bracket':
      return {
        backgroundColor: background,
        color: textColor,
        borderLeft: `4px solid ${colors.accent}`,
        borderRight: `4px solid ${colors.accent}`,
      }
    case 'outlined':
      return {
        backgroundColor: hexToRgba(background, 0.65),
        color: textColor,
        border: `2px solid ${colors.accent}`,
      }
    default:
      return {
        backgroundColor: background,
        color: textColor,
      }
  }
}
