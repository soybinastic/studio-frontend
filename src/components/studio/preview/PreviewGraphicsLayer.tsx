import type { LayoutType } from '@/types/session'
import type { GraphicsState } from '@/types/graphics'
import {
  backgroundShouldShow,
  bannerShouldShow,
  chatShouldShow,
  logoShouldShow,
  overlayShouldShow,
  qrShouldShow,
  tickerShouldShow,
} from '@/lib/graphics'
import { PreviewBackgroundLayer } from '@/components/studio/preview/PreviewBackgroundLayer'
import { PreviewBannerLayer } from '@/components/studio/preview/PreviewBannerLayer'
import { PreviewChatLayer } from '@/components/studio/preview/PreviewChatLayer'
import { PreviewTickerLayer } from '@/components/studio/preview/PreviewTickerLayer'
import { QR_CANVAS, qrPreviewRect } from '@/lib/qrGeometry'
import { getLogoPlacement } from '@/lib/logoPresets'
import { cn } from '@/lib/utils'

interface PreviewGraphicsLayerProps {
  layout: LayoutType
  graphics: GraphicsState | null
  variant: 'background' | 'overlay'
}

export function PreviewGraphicsLayer({ layout, graphics, variant }: PreviewGraphicsLayerProps) {
  if (!graphics) return null

  if (variant === 'background') {
    if (!backgroundShouldShow(graphics.background, layout)) return null
    return (
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <PreviewBackgroundLayer background={graphics.background!} />
      </div>
    )
  }

  const qrRect =
    qrShouldShow(graphics.qr) && graphics.qr ? qrPreviewRect(graphics.qr) : null
  const logoPlacement =
    logoShouldShow(graphics.logo) && graphics.logo ? getLogoPlacement(graphics.logo) : null
  const chatActive = chatShouldShow(graphics.chat)

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {logoPlacement && graphics.logo?.url && (
        <img
          src={graphics.logo.url}
          alt="Logo"
          className={cn(
            'absolute h-[10%] max-h-12 w-auto object-contain',
            logoPlacement === 'top-left' && 'left-[2%] top-[2%]',
            logoPlacement === 'top-right' && 'right-[2%] top-[2%]',
            logoPlacement === 'bottom-left' && 'bottom-[2%] left-[2%]',
            logoPlacement === 'bottom-right' && 'bottom-[2%] right-[2%]',
          )}
        />
      )}

      {overlayShouldShow(graphics.overlay) && graphics.overlay?.url && (
        <img
          src={graphics.overlay.url}
          alt="Overlay"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {bannerShouldShow(graphics.banner) && graphics.banner && (
        <PreviewBannerLayer banner={graphics.banner} />
      )}

      {tickerShouldShow(graphics.ticker) && graphics.ticker && (
        <PreviewTickerLayer ticker={graphics.ticker} chatActive={chatActive} />
      )}

      {chatActive && graphics.chat && <PreviewChatLayer chat={graphics.chat} />}

      {qrRect && graphics.qr?.url && (
        <img
          src={graphics.qr.url}
          alt={graphics.qr.title || 'QR Code'}
          className="absolute object-contain"
          style={{
            width: `${(qrRect.w / QR_CANVAS.w) * 100}%`,
            height: `${(qrRect.h / QR_CANVAS.h) * 100}%`,
            left: `${(qrRect.x / QR_CANVAS.w) * 100}%`,
            top: `${(qrRect.y / QR_CANVAS.h) * 100}%`,
          }}
        />
      )}
    </div>
  )
}
