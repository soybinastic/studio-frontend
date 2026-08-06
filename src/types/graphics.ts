export interface GraphicPosition {
  x: number
  y: number
  w?: number
  h?: number
}

export interface BackgroundGraphic {
  url: string
  source?: string
  is_active: boolean
  fit: 'cover' | 'stretch'
}

export interface OverlayGraphic {
  url: string
  source?: string
  is_active: boolean
  position: GraphicPosition
}

export type LogoPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface LogoGraphic {
  url: string
  source?: string
  is_active: boolean
  placement: LogoPlacement | string
  logoPosition?: string
  position?: string
}

export type QrPlacement = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'

export interface QrGraphic {
  url: string
  source?: string
  is_shown: boolean
  position: QrPlacement | GraphicPosition
  overlay_width: number
  overlay_height: number
  title: string
  primary: string
  secondary: string
  font?: string
}

export type BannerThemeStyle = 'default' | 'rounded' | 'bracket' | 'outlined' | 'classic' | 'pill'

export interface BannerGraphic {
  title: string
  description: string
  is_display: boolean
  is_display_names: boolean
  theme: BannerThemeStyle | 'plain' | 'accent'
  primary: string
  secondary: string
  accent?: string
  parent_data?: Record<string, unknown>
  textOverlay?: Record<string, unknown>
  graphic?: Record<string, unknown>
  font_size: number
}

export interface TickerGraphic {
  tickerText: string
  ticker_description?: string
  text?: string
  tickerEnabled: boolean
  tickerPosition: 'top' | 'bottom'
  tickerDirection: 'rtl' | 'ltr'
  tickerSpeed: number
  primary: string
  secondary: string
  textOverlay?: Record<string, unknown>
  bannerTickerStyle?: Record<string, unknown>
  chatOverlay?: boolean
}

export interface ChatGraphic {
  enabled: boolean
  messages: Array<{ author: string; text?: string; message?: string }>
}

export interface GraphicsState {
  background: BackgroundGraphic | null
  overlay: OverlayGraphic | null
  logo: LogoGraphic | null
  qr: QrGraphic | null
  banner: BannerGraphic | null
  ticker: TickerGraphic | null
  chat: ChatGraphic | null
  /** Scene-level font family (applies to banner, ticker, chat text overlays). */
  fonts?: string | null
}

export type GraphicLayerKey =
  | 'background'
  | 'overlay'
  | 'logo'
  | 'qr'
  | 'banner'
  | 'ticker'
  | 'chat'

export interface GraphicLayerMeta {
  key: GraphicLayerKey
  label: string
  category: 'background' | 'logo' | 'overlay' | 'banner' | 'ticker' | 'qr' | 'theme'
  icon: string
}
