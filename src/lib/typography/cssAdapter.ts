import {
  canonicalizeFontFamily,
  type StudioFontFamily,
} from '@/lib/typography/catalog'

/** Families available via Google Fonts CSS API. */
const GOOGLE_FONT_QUERY: Partial<Record<StudioFontFamily, string>> = {
  Rubik: 'Rubik:wght@400;700',
  'Roboto Slab': 'Roboto+Slab:wght@400;700',
  'Open Sans': 'Open+Sans:wght@400;700',
  'Bricolage Grotesque': 'Bricolage+Grotesque:wght@400;700',
  Montserrat: 'Montserrat:wght@400;700',
  'Shantell Sans': 'Shantell+Sans:wght@400;700',
  'Fira Mono': 'Fira+Mono:wght@400;700',
  'Permanent Marker': 'Permanent+Marker',
  Geologica: 'Geologica:wght@400;700',
  'Departure Mono': 'Fira+Mono:wght@400;700',
}

const loaded = new Set<string>()

function cssStack(family: StudioFontFamily): string {
  if (family === 'Arial') return 'Arial, Helvetica, sans-serif'
  if (family === 'Fira Mono' || family === 'Departure Mono') {
    return `"${family === 'Departure Mono' ? 'Fira Mono' : family}", ui-monospace, monospace`
  }
  return `"${family}", sans-serif`
}

/** CSS font-family value for preview overlays. */
export function cssFontFamily(family: string | null | undefined): string {
  const canonical = canonicalizeFontFamily(family)
  if (!canonical) return cssStack('Rubik')
  return cssStack(canonical)
}

/** Ensure a Google Font stylesheet is present for preview (no-op for Arial). */
export function ensureFontLoaded(family: string | null | undefined): void {
  if (typeof document === 'undefined') return
  const canonical = canonicalizeFontFamily(family)
  if (!canonical) return
  const query = GOOGLE_FONT_QUERY[canonical]
  if (!query || loaded.has(query)) return
  loaded.add(query)
  const href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`
  if (document.querySelector(`link[data-studio-font="${query}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.studioFont = query
  document.head.appendChild(link)
}
