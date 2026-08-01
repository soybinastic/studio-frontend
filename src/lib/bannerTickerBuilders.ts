import { DEFAULT_BANNER_ACCENT, DEFAULT_BRAND_COLORS } from '@/lib/bannerThemes'
import type { BannerGraphic, BannerThemeStyle, TickerGraphic } from '@/types/graphics'

export interface BannerFormValues {
  title: string
  description: string
  theme: BannerThemeStyle
  primary: string
  secondary: string
  accent: string
  font_size: number
  is_display_names: boolean
}

export interface TickerFormValues {
  tickerText: string
  tickerPosition: 'top' | 'bottom'
  tickerDirection: 'rtl' | 'ltr'
  tickerSpeed: number
  primary: string
  secondary: string
}

export const DEFAULT_BANNER_FORM: BannerFormValues = {
  title: '',
  description: '',
  theme: 'classic',
  primary: DEFAULT_BRAND_COLORS.primary,
  secondary: DEFAULT_BRAND_COLORS.secondary,
  accent: DEFAULT_BANNER_ACCENT,
  font_size: 32,
  is_display_names: true,
}

export const DEFAULT_TICKER_FORM: TickerFormValues = {
  tickerText: '',
  tickerPosition: 'bottom',
  tickerDirection: 'rtl',
  tickerSpeed: 2.0,
  primary: '#111827',
  secondary: '#ffffff',
}

export function buildBannerGraphic(values: BannerFormValues): BannerGraphic {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    is_display: true,
    is_display_names: values.is_display_names,
    theme: values.theme,
    primary: values.primary,
    secondary: values.secondary,
    accent: values.accent,
    font_size: values.font_size,
  }
}

export function buildTickerGraphic(values: TickerFormValues): TickerGraphic {
  return {
    tickerText: values.tickerText.trim(),
    tickerEnabled: true,
    tickerPosition: values.tickerPosition,
    tickerDirection: values.tickerDirection,
    tickerSpeed: values.tickerSpeed,
    primary: values.primary,
    secondary: values.secondary,
  }
}

export function isBannerFormValid(values: BannerFormValues): boolean {
  return Boolean(values.title.trim() || values.description.trim())
}

export function isTickerFormValid(values: TickerFormValues): boolean {
  return Boolean(values.tickerText.trim())
}

export function bannerFormFromGraphic(banner: BannerGraphic | null | undefined): BannerFormValues {
  if (!banner) return { ...DEFAULT_BANNER_FORM }
  return {
    title: banner.title ?? '',
    description: banner.description ?? '',
    theme: (banner.theme as BannerThemeStyle) ?? 'classic',
    primary: banner.primary ?? DEFAULT_BRAND_COLORS.primary,
    secondary: banner.secondary ?? DEFAULT_BRAND_COLORS.secondary,
    accent: banner.accent ?? DEFAULT_BANNER_ACCENT,
    font_size: banner.font_size ?? 32,
    is_display_names: banner.is_display_names ?? true,
  }
}

export function tickerFormFromGraphic(ticker: TickerGraphic | null | undefined): TickerFormValues {
  if (!ticker) return { ...DEFAULT_TICKER_FORM }
  return {
    tickerText: ticker.tickerText ?? '',
    tickerPosition: ticker.tickerPosition ?? 'bottom',
    tickerDirection: ticker.tickerDirection ?? 'rtl',
    tickerSpeed: ticker.tickerSpeed ?? 2.0,
    primary: ticker.primary ?? '#111827',
    secondary: ticker.secondary ?? '#ffffff',
  }
}
