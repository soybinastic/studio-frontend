/** Catalog of scene font families (parity with compositor FontCatalog). */

export const DEFAULT_DISPLAY_FONT = 'Rubik'

/** Canonical family names supported by compositor burn-in. */
export const STUDIO_FONT_FAMILIES = [
  'Arial',
  'Rubik',
  'Roboto Slab',
  'Open Sans',
  'Bricolage Grotesque',
  'Montserrat',
  'Shantell Sans',
  'Fira Mono',
  'Permanent Marker',
  'Geologica',
  'Departure Mono',
] as const

export type StudioFontFamily = (typeof STUDIO_FONT_FAMILIES)[number]

const FAMILY_SET = new Set<string>(STUDIO_FONT_FAMILIES)

export function canonicalizeFontFamily(name: string | null | undefined): StudioFontFamily | null {
  if (!name) return null
  const text = name.trim()
  if (!text) return null
  if (FAMILY_SET.has(text)) return text as StudioFontFamily
  const lower = text.toLowerCase()
  for (const family of STUDIO_FONT_FAMILIES) {
    if (family.toLowerCase() === lower) return family
  }
  return null
}

export function listStudioFontFamilies(): readonly StudioFontFamily[] {
  return STUDIO_FONT_FAMILIES
}
