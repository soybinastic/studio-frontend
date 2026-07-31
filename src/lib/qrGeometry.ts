import type { QrGraphic, QrPlacement } from '@/types/graphics'

/** Matches compositor-backend apps/graphics/constants.py */
export const QR_CANVAS = { w: 1920, h: 1080 } as const
export const QR_CORNER_SIZE = 200
export const QR_CENTER_WIDTH = 250
export const QR_CENTER_HEIGHT = 200
export const QR_EDGE_MARGIN = 20

export const QR_PLACEMENTS: readonly QrPlacement[] = [
  'top-left',
  'top-right',
  'center',
  'bottom-left',
  'bottom-right',
]

export const DEFAULT_QR_PLACEMENT: QrPlacement = 'bottom-right'

export function normalizeQrPlacement(value: unknown): QrPlacement {
  const key = String(value ?? DEFAULT_QR_PLACEMENT).toLowerCase().replace(/_/g, '-')
  if (key === 'topleft' || key === 'top-left') return 'top-left'
  if (key === 'topright' || key === 'top-right') return 'top-right'
  if (key === 'bottomleft' || key === 'bottom-left') return 'bottom-left'
  if (key === 'bottomright' || key === 'bottom-right') return 'bottom-right'
  if (key === 'center') return 'center'
  return DEFAULT_QR_PLACEMENT
}

export function getQrPlacement(config: QrGraphic | null | undefined): QrPlacement {
  if (!config) return DEFAULT_QR_PLACEMENT
  const { position } = config
  if (typeof position === 'string') return normalizeQrPlacement(position)
  return DEFAULT_QR_PLACEMENT
}

export function qrDimensionsForPlacement(placement: QrPlacement): {
  overlay_width: number
  overlay_height: number
} {
  if (placement === 'center') {
    return { overlay_width: QR_CENTER_WIDTH, overlay_height: QR_CENTER_HEIGHT }
  }
  return { overlay_width: QR_CORNER_SIZE, overlay_height: QR_CORNER_SIZE }
}

export function qrPreviewRect(
  config: Pick<QrGraphic, 'position' | 'overlay_width' | 'overlay_height'>,
  canvasW = QR_CANVAS.w,
  canvasH = QR_CANVAS.h,
): { x: number; y: number; w: number; h: number } {
  const position = config.position

  if (typeof position === 'object' && position !== null && 'x' in position && 'y' in position) {
    const w = config.overlay_width || position.w || QR_CORNER_SIZE
    const h = config.overlay_height || position.h || QR_CORNER_SIZE
    return clampRect(position.x, position.y, w, h, canvasW, canvasH)
  }

  const placement = normalizeQrPlacement(position)
  if (placement === 'center') {
    const w = config.overlay_width || QR_CENTER_WIDTH
    const h = config.overlay_height || QR_CENTER_HEIGHT
    return clampRect((canvasW - w) / 2, (canvasH - h) / 2, w, h, canvasW, canvasH)
  }

  const w = config.overlay_width || QR_CORNER_SIZE
  const h = config.overlay_height || QR_CORNER_SIZE

  switch (placement) {
    case 'top-left':
      return clampRect(QR_EDGE_MARGIN, QR_EDGE_MARGIN, w, h, canvasW, canvasH)
    case 'top-right':
      return clampRect(canvasW - w - QR_EDGE_MARGIN, QR_EDGE_MARGIN, w, h, canvasW, canvasH)
    case 'bottom-left':
      return clampRect(QR_EDGE_MARGIN, canvasH - h - QR_EDGE_MARGIN, w, h, canvasW, canvasH)
    default:
      return clampRect(
        canvasW - w - QR_EDGE_MARGIN,
        canvasH - h - QR_EDGE_MARGIN,
        w,
        h,
        canvasW,
        canvasH,
      )
  }
}

function clampRect(
  x: number,
  y: number,
  w: number,
  h: number,
  canvasW: number,
  canvasH: number,
): { x: number; y: number; w: number; h: number } {
  const width = Math.max(1, Math.min(w, canvasW))
  const height = Math.max(1, Math.min(h, canvasH))
  return {
    x: Math.max(0, Math.min(x, canvasW - width)),
    y: Math.max(0, Math.min(y, canvasH - height)),
    w: width,
    h: height,
  }
}

export function buildQrGraphic(
  url: string,
  placement: QrPlacement,
  existing?: QrGraphic | null,
): QrGraphic {
  const dimensions = qrDimensionsForPlacement(placement)
  return {
    url,
    is_shown: true,
    position: placement,
    title: existing?.title ?? 'Scan me',
    primary: existing?.primary ?? '#ffffff',
    secondary: existing?.secondary ?? '#000000',
    ...dimensions,
  }
}
