import { useCallback, useState } from 'react'
import { BackgroundSection } from '@/components/studio/sidebar/BackgroundSection'
import { BannerSection } from '@/components/studio/sidebar/BannerSection'
import { BannerTickerConfigModal } from '@/components/studio/sidebar/BannerTickerConfigModal'
import { LogoSection } from '@/components/studio/sidebar/LogoSection'
import { OverlaySection } from '@/components/studio/sidebar/OverlaySection'
import { QrSection } from '@/components/studio/sidebar/QrSection'
import { TickerConfigModal } from '@/components/studio/sidebar/TickerConfigModal'
import { TickerSection } from '@/components/studio/sidebar/TickerSection'
import { ThemeStyleSection } from '@/components/studio/sidebar/ThemeStyleSection'
import { useAssetCatalog } from '@/hooks/useAssetCatalog'
import {
  BANNER_PRESETS,
  TICKER_PRESETS,
  buildBannerFromPreset,
  buildTickerFromPreset,
  isSameBannerPreset,
  isSameTickerPreset,
} from '@/lib/bannerTickerPresets'
import {
  buildQrGraphicFromCatalogPreset,
  type QrCatalogPreset,
} from '@/lib/assetCatalogPresets'
import { resolveGraphicUrl } from '@/lib/graphics'
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
  onUpdateLayers?: (partial: Partial<GraphicsState>) => void
  disabled?: boolean
  isSaving?: boolean
}

export function GraphicsPanel({
  layout,
  graphics,
  isHost,
  onUpdate,
  onUpdateLayers,
  disabled,
  isSaving,
}: GraphicsPanelProps) {
  const readOnly = disabled || !isHost
  const { backgrounds, overlays, logos, qrCodes } = useAssetCatalog()
  const [bannerModalOpen, setBannerModalOpen] = useState(false)
  const [tickerModalOpen, setTickerModalOpen] = useState(false)

  const handleBackgroundSelect = useCallback(
    (url: string) => {
      const currentUrl = resolveGraphicUrl(graphics?.background)
      const isSame = currentUrl === url && graphics?.background?.is_active
      if (isSame) {
        onUpdate('background', null)
        return
      }
      onUpdate('background', {
        url,
        source: url,
        is_active: true,
        fit: graphics?.background?.fit ?? 'cover',
      })
    },
    [onUpdate, graphics?.background],
  )

  const handleLogoSelect = useCallback(
    (url: string) => {
      const currentUrl = resolveGraphicUrl(graphics?.logo)
      const isSame = currentUrl === url && graphics?.logo?.is_active
      if (isSame) {
        onUpdate('logo', null)
        return
      }
      const placement = getLogoPlacement(graphics?.logo)
      onUpdate('logo', { ...buildLogoGraphic(url, placement), source: url })
    },
    [onUpdate, graphics?.logo],
  )

  const handleLogoPlacementChange = useCallback(
    (placement: LogoPlacement) => {
      const currentUrl = resolveGraphicUrl(graphics?.logo)
      if (!currentUrl) return
      onUpdate('logo', { ...buildLogoGraphic(currentUrl, placement), source: currentUrl })
    },
    [onUpdate, graphics?.logo],
  )

  const handleOverlaySelect = useCallback(
    (url: string) => {
      const currentUrl = resolveGraphicUrl(graphics?.overlay)
      const isSame = currentUrl === url && graphics?.overlay?.is_active
      if (isSame) {
        onUpdate('overlay', null)
        return
      }
      onUpdate('overlay', {
        url,
        source: url,
        is_active: true,
        position: { ...FULL_FRAME_OVERLAY_POSITION },
      })
    },
    [onUpdate, graphics?.overlay],
  )

  const handleQrSelect = useCallback(
    (url: string) => {
      const currentUrl = resolveGraphicUrl(graphics?.qr)
      const isSame = currentUrl === url && graphics?.qr?.is_shown
      if (isSame) {
        onUpdate('qr', null)
        return
      }
      const catalogPreset = qrCodes.find((preset) => preset.url === url) as
        | QrCatalogPreset
        | undefined
      if (catalogPreset?.meta_data && Object.keys(catalogPreset.meta_data).length > 0) {
        onUpdate('qr', buildQrGraphicFromCatalogPreset(catalogPreset, graphics?.qr))
        return
      }
      const placement = getQrPlacement(graphics?.qr)
      onUpdate('qr', { ...buildQrGraphic(url, placement, graphics?.qr), source: url })
    },
    [onUpdate, graphics?.qr, qrCodes],
  )

  const handleQrPlacementChange = useCallback(
    (placement: QrPlacement) => {
      const currentUrl = resolveGraphicUrl(graphics?.qr)
      if (!currentUrl) return
      onUpdate('qr', buildQrGraphic(currentUrl, placement, graphics?.qr))
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

  const handleBannerCreateSave = useCallback(
    (payload: { banner: NonNullable<GraphicsState['banner']>; ticker?: NonNullable<GraphicsState['ticker']> }) => {
      if (payload.ticker && onUpdateLayers) {
        onUpdateLayers({ banner: payload.banner, ticker: payload.ticker })
      } else {
        onUpdate('banner', payload.banner)
      }
      setBannerModalOpen(false)
    },
    [onUpdate, onUpdateLayers],
  )

  const handleTickerCreateSave = useCallback(
    (ticker: NonNullable<GraphicsState['ticker']>) => {
      onUpdate('ticker', ticker)
      setTickerModalOpen(false)
    },
    [onUpdate],
  )

  return (
    <div className="space-y-3">
      <BackgroundSection
        presets={backgrounds}
        layout={layout}
        background={graphics?.background ?? null}
        disabled={readOnly}
        onSelect={handleBackgroundSelect}
        onClear={() => onUpdate('background', null)}
        onFitChange={(fit) => {
          const currentUrl = resolveGraphicUrl(graphics?.background)
          onUpdate('background', {
            url: currentUrl,
            source: currentUrl,
            is_active: true,
            fit,
          })
        }}
      />

      <LogoSection
        presets={logos}
        logo={graphics?.logo ?? null}
        disabled={readOnly}
        onSelect={handleLogoSelect}
        onPlacementChange={handleLogoPlacementChange}
        onClear={() => onUpdate('logo', null)}
      />

      <OverlaySection
        presets={overlays}
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
        onCreateCustom={readOnly ? undefined : () => setBannerModalOpen(true)}
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
        onCreateCustom={readOnly ? undefined : () => setTickerModalOpen(true)}
      />

      <QrSection
        presets={qrCodes}
        qr={graphics?.qr ?? null}
        disabled={readOnly}
        onSelect={handleQrSelect}
        onPlacementChange={handleQrPlacementChange}
        onClear={() => onUpdate('qr', null)}
      />

      <BannerTickerConfigModal
        open={bannerModalOpen}
        onOpenChange={setBannerModalOpen}
        onSave={handleBannerCreateSave}
        isSaving={isSaving}
      />

      <TickerConfigModal
        open={tickerModalOpen}
        onOpenChange={setTickerModalOpen}
        onSave={handleTickerCreateSave}
        isSaving={isSaving}
      />
    </div>
  )
}
