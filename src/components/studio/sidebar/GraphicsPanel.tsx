import { useCallback } from 'react'
import { BackgroundSection } from '@/components/studio/sidebar/BackgroundSection'
import { BannerSection } from '@/components/studio/sidebar/BannerSection'
import { LogoSection } from '@/components/studio/sidebar/LogoSection'
import { OverlaySection } from '@/components/studio/sidebar/OverlaySection'
import { QrSection } from '@/components/studio/sidebar/QrSection'
import { TickerSection } from '@/components/studio/sidebar/TickerSection'
import { ThemeStyleSection } from '@/components/studio/sidebar/ThemeStyleSection'
import {
  BANNER_PRESETS,
  TICKER_PRESETS,
  buildBannerFromPreset,
  buildTickerFromPreset,
  isSameBannerPreset,
  isSameTickerPreset,
} from '@/lib/bannerTickerPresets'
import { buildLogoGraphic, getLogoPlacement } from '@/lib/logoPresets'
import { FULL_FRAME_OVERLAY_POSITION } from '@/lib/overlayPresets'
import { buildQrGraphic, getQrPlacement } from '@/lib/qrGeometry'
import type { BannerThemeStyle, LogoPlacement, QrPlacement } from '@/types/graphics'
import type { LayoutType } from '@/types/session'
import type { GraphicLayerKey, GraphicsState } from '@/types/graphics'

interface GraphicsPanelProps {
  layout: LayoutType
  graphics: GraphicsState | null
  isHost: boolean
  onUpdate: (layer: GraphicLayerKey, value: GraphicsState[GraphicLayerKey]) => void
  disabled?: boolean
}

export function GraphicsPanel({
  layout,
  graphics,
  isHost,
  onUpdate,
  disabled,
}: GraphicsPanelProps) {
  const readOnly = disabled || !isHost

  const handleBackgroundSelect = useCallback(
    (url: string) => {
      const isSame = graphics?.background?.url === url && graphics?.background?.is_active
      if (isSame) {
        onUpdate('background', null)
        return
      }
      onUpdate('background', {
        url,
        is_active: true,
        fit: graphics?.background?.fit ?? 'cover',
      })
    },
    [onUpdate, graphics?.background?.url, graphics?.background?.is_active, graphics?.background?.fit],
  )

  const handleLogoSelect = useCallback(
    (url: string) => {
      const isSame = graphics?.logo?.url === url && graphics?.logo?.is_active
      if (isSame) {
        onUpdate('logo', null)
        return
      }
      const placement = getLogoPlacement(graphics?.logo)
      onUpdate('logo', buildLogoGraphic(url, placement))
    },
    [onUpdate, graphics?.logo],
  )

  const handleLogoPlacementChange = useCallback(
    (placement: LogoPlacement) => {
      if (!graphics?.logo?.url) return
      onUpdate('logo', buildLogoGraphic(graphics.logo.url, placement))
    },
    [onUpdate, graphics?.logo],
  )

  const handleOverlaySelect = useCallback(
    (url: string) => {
      const isSame = graphics?.overlay?.url === url && graphics?.overlay?.is_active
      if (isSame) {
        onUpdate('overlay', null)
        return
      }
      onUpdate('overlay', {
        url,
        is_active: true,
        position: { ...FULL_FRAME_OVERLAY_POSITION },
      })
    },
    [onUpdate, graphics?.overlay?.url, graphics?.overlay?.is_active],
  )

  const handleQrSelect = useCallback(
    (url: string) => {
      const isSame = graphics?.qr?.url === url && graphics?.qr?.is_shown
      if (isSame) {
        onUpdate('qr', null)
        return
      }
      const placement = getQrPlacement(graphics?.qr)
      onUpdate('qr', buildQrGraphic(url, placement, graphics?.qr))
    },
    [onUpdate, graphics?.qr],
  )

  const handleQrPlacementChange = useCallback(
    (placement: QrPlacement) => {
      if (!graphics?.qr?.url) return
      onUpdate('qr', buildQrGraphic(graphics.qr.url, placement, graphics.qr))
    },
    [onUpdate, graphics?.qr],
  )

  const handleBannerSelect = useCallback(
    (presetId: string) => {
      const preset = BANNER_PRESETS.find((item) => item.id === presetId)
      if (!preset) return
      if (isSameBannerPreset(graphics?.banner, preset)) {
        onUpdate('banner', null)
        return
      }
      onUpdate('banner', buildBannerFromPreset(preset))
    },
    [onUpdate, graphics?.banner],
  )

  const handleTickerSelect = useCallback(
    (presetId: string) => {
      const preset = TICKER_PRESETS.find((item) => item.id === presetId)
      if (!preset) return
      if (isSameTickerPreset(graphics?.ticker, preset)) {
        onUpdate('ticker', null)
        return
      }
      onUpdate('ticker', buildTickerFromPreset(preset))
    },
    [onUpdate, graphics?.ticker],
  )

  const handleBannerThemeChange = useCallback(
    (theme: BannerThemeStyle) => {
      if (!graphics?.banner) return
      onUpdate('banner', { ...graphics.banner, theme })
    },
    [onUpdate, graphics?.banner],
  )

  const handleBannerColorsChange = useCallback(
    (colors: { primary?: string; secondary?: string; accent?: string }) => {
      if (!graphics?.banner) return
      onUpdate('banner', { ...graphics.banner, ...colors })
    },
    [onUpdate, graphics?.banner],
  )

  return (
    <div className="space-y-3">
      <BackgroundSection
        layout={layout}
        background={graphics?.background ?? null}
        disabled={readOnly}
        onSelect={handleBackgroundSelect}
        onClear={() => onUpdate('background', null)}
        onFitChange={(fit) =>
          onUpdate('background', {
            url: graphics?.background?.url ?? '',
            is_active: true,
            fit,
          })
        }
      />

      <LogoSection
        logo={graphics?.logo ?? null}
        disabled={readOnly}
        onSelect={handleLogoSelect}
        onPlacementChange={handleLogoPlacementChange}
        onClear={() => onUpdate('logo', null)}
      />

      <OverlaySection
        overlay={graphics?.overlay ?? null}
        disabled={readOnly}
        onSelect={handleOverlaySelect}
        onClear={() => onUpdate('overlay', null)}
      />

      <BannerSection
        banner={graphics?.banner ?? null}
        disabled={readOnly}
        onSelect={handleBannerSelect}
        onClear={() => onUpdate('banner', null)}
      />

      <ThemeStyleSection
        banner={graphics?.banner ?? null}
        disabled={readOnly}
        onThemeChange={handleBannerThemeChange}
        onColorsChange={handleBannerColorsChange}
      />

      <TickerSection
        ticker={graphics?.ticker ?? null}
        disabled={readOnly}
        onSelect={handleTickerSelect}
        onClear={() => onUpdate('ticker', null)}
      />

      <QrSection
        qr={graphics?.qr ?? null}
        disabled={readOnly}
        onSelect={handleQrSelect}
        onPlacementChange={handleQrPlacementChange}
        onClear={() => onUpdate('qr', null)}
      />
    </div>
  )
}
