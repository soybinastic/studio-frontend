import { apiRequest } from '@/api/client'
import type { GraphicsState, BackgroundGraphic, OverlayGraphic, LogoGraphic, QrGraphic, BannerGraphic, TickerGraphic, ChatGraphic } from '@/types/graphics'

export function getGraphics(sessionId: string) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/`)
}

export function updateGraphicsBulk(sessionId: string, body: Partial<GraphicsState>) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/bulk/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setBackground(sessionId: string, body: BackgroundGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/background/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setOverlay(sessionId: string, body: OverlayGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/overlay/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setLogo(sessionId: string, body: LogoGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/logo/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setQr(sessionId: string, body: QrGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/qr/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setBanner(sessionId: string, body: BannerGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/banner/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setTicker(sessionId: string, body: TickerGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/ticker/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function setChat(sessionId: string, body: ChatGraphic) {
  return apiRequest<GraphicsState>(`/sessions/${sessionId}/graphics/chat/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
