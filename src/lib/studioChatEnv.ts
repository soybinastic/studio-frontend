import { resolveStudioChatWsUrl } from '@/types/studio-chat-signal'

export function getStudioChatWsUrl(): string | null {
  const configured = import.meta.env.VITE_STUDIO_CHAT_WS_URL?.trim()
  if (configured) {
    return resolveStudioChatWsUrl(configured)
  }
  return null
}

export function isStudioChatEnabled(): boolean {
  return Boolean(getStudioChatWsUrl())
}
