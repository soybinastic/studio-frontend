import { resolveStudioChatWsUrl } from '@/types/studio-chat-signal'

export function getStudioChatWsUrl(): string | null {
  const configured = import.meta.env.VITE_STUDIO_CHAT_WS_URL?.trim()
  if (configured) {
    return resolveStudioChatWsUrl(configured)
  }
  return null
}

export function getStudioChatHttpUrl(): string | null {
  const configured = import.meta.env.VITE_STUDIO_CHAT_WS_URL?.trim()
  if (!configured) {
    return null
  }
  const trimmed = configured.replace(/\/$/, '')
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed.replace(/^wss/i, 'https').replace(/^ws/i, 'http')
  }
  return trimmed
}

export function isStudioChatEnabled(): boolean {
  return Boolean(getStudioChatWsUrl())
}
