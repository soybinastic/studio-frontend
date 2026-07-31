import type { BannerGraphic, TickerGraphic } from '@/types/graphics'

export interface BannerPreset {
  id: string
  label: string
  banner: BannerGraphic
}

export interface TickerPreset {
  id: string
  label: string
  ticker: TickerGraphic
}

/** Placeholder lower-thirds — replace with host/participant-driven data later. */
export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'host-intro',
    label: 'Host intro',
    banner: {
      title: 'Alex Rivera',
      description: 'Live from Studio A',
      is_display: true,
      is_display_names: true,
      theme: 'classic',
      primary: '#111111',
      secondary: '#374151',
      accent: '#38bdf8',
      font_size: 32,
    },
  },
  {
    id: 'short-title',
    label: 'Short title',
    banner: {
      title: 'Q&A',
      description: '',
      is_display: true,
      is_display_names: true,
      theme: 'classic',
      primary: '#1e293b',
      secondary: '#334155',
      accent: '#38bdf8',
      font_size: 32,
    },
  },
  {
    id: 'guest-spotlight',
    label: 'Guest spotlight',
    banner: {
      title: 'Dr. Jane Smith',
      description: 'Product Lead · Acme Co',
      is_display: true,
      is_display_names: true,
      theme: 'default',
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#38bdf8',
      font_size: 32,
    },
  },
]

/** Placeholder ticker copy — replace with live feed / CMS data later. */
export const TICKER_PRESETS: TickerPreset[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    ticker: {
      tickerText: 'Welcome to the live stream — say hi in the chat!',
      tickerEnabled: true,
      tickerPosition: 'bottom',
      tickerDirection: 'rtl',
      tickerSpeed: 2.0,
      primary: '#000000',
      secondary: '#ffffff',
    },
  },
  {
    id: 'cta',
    label: 'Call to action',
    ticker: {
      tickerText: 'Visit example.com for exclusive offers • Follow us @studio',
      tickerEnabled: true,
      tickerPosition: 'bottom',
      tickerDirection: 'rtl',
      tickerSpeed: 2.5,
      primary: '#111827',
      secondary: '#fbbf24',
    },
  },
  {
    id: 'breaking-top',
    label: 'Breaking (top)',
    ticker: {
      tickerText: 'BREAKING: New feature launch today at 3 PM ET',
      tickerEnabled: true,
      tickerPosition: 'top',
      tickerDirection: 'ltr',
      tickerSpeed: 2.0,
      primary: '#991b1b',
      secondary: '#ffffff',
    },
  },
]

export function buildBannerFromPreset(preset: BannerPreset): BannerGraphic {
  return { ...preset.banner, is_display: true }
}

export function buildTickerFromPreset(preset: TickerPreset): TickerGraphic {
  return { ...preset.ticker, tickerEnabled: true }
}

export function isSameBannerPreset(
  banner: BannerGraphic | null | undefined,
  preset: BannerPreset,
): boolean {
  if (!banner?.is_display) return false
  return banner.title === preset.banner.title && banner.description === preset.banner.description
}

export function isSameTickerPreset(
  ticker: TickerGraphic | null | undefined,
  preset: TickerPreset,
): boolean {
  if (!ticker?.tickerEnabled) return false
  return ticker.tickerText === preset.ticker.tickerText
}
