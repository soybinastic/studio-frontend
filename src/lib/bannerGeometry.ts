import type { BannerGraphic } from '@/types/graphics'

/** Matches compositor-backend apps/graphics/constants.py */
export const BANNER_CANVAS = { w: 1920, h: 1080 } as const
export const BANNER_X = 40
export const BANNER_MIN_WIDTH = 120

const BANNER_MAX_WIDTH = BANNER_CANVAS.w - BANNER_X * 2

/** Approximate rendered text width (matches PIL draw.text horizontal padding). */
export function estimateTextWidth(text: string, fontSize: number): number {
  if (!text.trim()) return 0
  const avgCharWidth = fontSize * 0.58
  const horizontalPadding = 40
  return Math.ceil(text.length * avgCharWidth + horizontalPadding)
}

export function bannerContentWidth(banner: BannerGraphic): number {
  const fontSize = banner.font_size || 32
  const titleWidth = estimateTextWidth(banner.title ?? '', fontSize)
  const descFontSize = Math.max(16, fontSize - 8)
  const descWidth = estimateTextWidth(banner.description ?? '', descFontSize)
  const contentWidth = Math.max(titleWidth, descWidth, BANNER_MIN_WIDTH)
  return Math.min(BANNER_MAX_WIDTH, contentWidth)
}
