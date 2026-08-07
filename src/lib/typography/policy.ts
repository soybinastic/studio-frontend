import {
  DEFAULT_DISPLAY_FONT,
  canonicalizeFontFamily,
  type StudioFontFamily,
} from '@/lib/typography/catalog'
import type { GraphicsState } from '@/types/graphics'

/** Family for program/engine semantics — null means legacy compositor burn-in. */
export function resolveEngineFont(
  fonts: string | null | undefined,
): StudioFontFamily | null {
  return canonicalizeFontFamily(fonts)
}

/** Family for picker + preview (defaults to Rubik when unset). */
export function resolveDisplayFont(
  fonts: string | null | undefined,
): StudioFontFamily {
  return resolveEngineFont(fonts) ?? DEFAULT_DISPLAY_FONT
}

export function resolveDisplayFontFromGraphics(
  graphics: Pick<GraphicsState, 'fonts'> | null | undefined,
): StudioFontFamily {
  return resolveDisplayFont(graphics?.fonts)
}
