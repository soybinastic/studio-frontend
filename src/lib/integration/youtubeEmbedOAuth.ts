export const STUDIO_EMBED_AWAITING_CONNECT_KEY = 'studio-embed-awaiting-connect'

export function markEmbedYouTubeConnectAwaiting(tenantId: string): void {
  sessionStorage.setItem(
    STUDIO_EMBED_AWAITING_CONNECT_KEY,
    JSON.stringify({ platform: 'youtube', tenantId }),
  )
}

export function clearEmbedYouTubeConnectAwaiting(): void {
  sessionStorage.removeItem(STUDIO_EMBED_AWAITING_CONNECT_KEY)
}

export function isEmbedYouTubeConnectAwaiting(tenantId: string): boolean {
  const raw = sessionStorage.getItem(STUDIO_EMBED_AWAITING_CONNECT_KEY)
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw) as { platform?: string; tenantId?: string }
    return parsed.platform === 'youtube' && parsed.tenantId === tenantId
  } catch {
    clearEmbedYouTubeConnectAwaiting()
    return false
  }
}
