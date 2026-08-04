/** Matches compositor-backend apps/graphics/constants.py */
export const CHAT_CANVAS = { w: 1920, h: 1080 } as const
export const CHAT_PANEL_WIDTH = 550
export const CHAT_PANEL_HEIGHT = 830
export const CHAT_EDGE_MARGIN = 20
export const TICKER_CHAT_Y_NUDGE = 25

export interface ChatPreviewRect {
  x: number
  y: number
  w: number
  h: number
}

export function chatPreviewRect(
  canvasW = CHAT_CANVAS.w,
  canvasH = CHAT_CANVAS.h,
): ChatPreviewRect {
  const w = Math.min(CHAT_PANEL_WIDTH, canvasW - CHAT_EDGE_MARGIN * 2)
  const h = Math.min(CHAT_PANEL_HEIGHT, canvasH - CHAT_EDGE_MARGIN * 2)
  const x = canvasW - w - CHAT_EDGE_MARGIN
  const y = CHAT_EDGE_MARGIN
  return { x, y, w, h }
}

export function chatPreviewStyle(rect: ChatPreviewRect = chatPreviewRect()) {
  return {
    left: `${(rect.x / CHAT_CANVAS.w) * 100}%`,
    top: `${(rect.y / CHAT_CANVAS.h) * 100}%`,
    width: `${(rect.w / CHAT_CANVAS.w) * 100}%`,
    height: `${(rect.h / CHAT_CANVAS.h) * 100}%`,
  } as const
}
