import type { LayoutType } from '@/types/session'

export interface LayoutMeta {
  type: LayoutType
  label: string
  description: string
  /** CSS class hint for HTML preview approximation only — NOT compositor positioning */
  previewClass: string
}

/**
 * Layout metadata for UI display and preview hints.
 * Actual positioning/scaling/cropping is handled by the compositor backend.
 */
export const LAYOUTS: LayoutMeta[] = [
  { type: 'CONTAIN', label: 'Contain', description: 'Dynamic grid, fit participants', previewClass: 'preview-contain' },
  { type: 'COVER', label: 'Cover', description: 'Grid with fill tiles', previewClass: 'preview-cover' },
  { type: 'THUMBNAIL', label: 'Thumbnail', description: 'Host main + bottom strip', previewClass: 'preview-thumbnail' },
  { type: 'GRID', label: 'Grid', description: 'Fixed 2×2 / 3×3 grid', previewClass: 'preview-grid' },
  { type: 'SIDE_BY_SIDE', label: 'Side by Side', description: '50/50 split', previewClass: 'preview-side-by-side' },
  { type: 'HALFSCREEN', label: 'Half Screen', description: '50/50 split', previewClass: 'preview-side-by-side' },
  { type: 'SPOTLIGHT', label: 'Spotlight', description: 'Host + side strip', previewClass: 'preview-spotlight' },
  { type: 'CINEMA', label: 'Cinema', description: 'Host + filmstrip', previewClass: 'preview-cinema' },
  { type: 'PICTURE_IN_PICTURE', label: 'Picture in Picture', description: 'Main + floating inset', previewClass: 'preview-pip' },
  { type: 'OVERLAY', label: 'Overlay', description: 'Floating PiP overlay', previewClass: 'preview-pip' },
  { type: 'FULLSCREEN', label: 'Fullscreen', description: 'Host only, full frame', previewClass: 'preview-fullscreen' },
]

export function getLayoutMeta(type: LayoutType): LayoutMeta {
  return LAYOUTS.find((l) => l.type === type) ?? LAYOUTS[0]
}
