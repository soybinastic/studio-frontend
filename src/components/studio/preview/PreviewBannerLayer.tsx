import { useEffect } from 'react'
import type { BannerGraphic } from '@/types/graphics'
import { bannerContentWidth, BANNER_CANVAS, BANNER_X } from '@/lib/bannerGeometry'
import {
  bannerBarStyle,
  bannerShapeClassName,
  normalizeBannerTheme,
  resolveBannerBrandColors,
} from '@/lib/bannerThemes'
import { cssFontFamily, ensureFontLoaded } from '@/lib/typography/cssAdapter'
import { resolveDisplayFont } from '@/lib/typography/policy'
import { cn } from '@/lib/utils'

interface PreviewBannerLayerProps {
  banner: BannerGraphic
  fonts?: string | null
}

export function PreviewBannerLayer({ banner, fonts }: PreviewBannerLayerProps) {
  const hasDescription = Boolean(banner.description?.trim())
  const fontSize = banner.font_size || 32
  const extra = fontSize >= 70 ? 40 : 0
  const bottomPct = hasDescription
    ? ((96 + extra + 48 + 48) / BANNER_CANVAS.h) * 100
    : ((40 + extra + 48) / BANNER_CANVAS.h) * 100

  const theme = normalizeBannerTheme(banner.theme)
  const colors = resolveBannerBrandColors(banner)
  const shapeClass = bannerShapeClassName(theme)
  const displayFont = resolveDisplayFont(fonts)

  useEffect(() => {
    ensureFontLoaded(displayFont)
  }, [displayFont])

  return (
    <div
      className="absolute"
      style={{
        left: `${(BANNER_X / BANNER_CANVAS.w) * 100}%`,
        bottom: `${bottomPct}%`,
        width: `${(bannerContentWidth(banner) / BANNER_CANVAS.w) * 100}%`,
        fontFamily: cssFontFamily(displayFont),
      }}
    >
      <div
        className={cn('px-3 py-1.5', shapeClass)}
        style={bannerBarStyle(theme, 'title', colors)}
      >
        <p className="truncate text-xs font-semibold">{banner.title}</p>
      </div>

      {hasDescription && (
        <div
          className={cn('mt-0.5 px-3 py-1', shapeClass)}
          style={bannerBarStyle(theme, 'description', colors)}
        >
          <p className="truncate text-[10px]">{banner.description}</p>
        </div>
      )}
    </div>
  )
}
