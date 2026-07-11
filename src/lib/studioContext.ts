import type { StudioSessionContext } from '@/types/session'

const STORAGE_KEY = 'studio-session-context'

export function saveStudioContext(context: StudioSessionContext): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
}

export function loadStudioContext(sessionId: string): StudioSessionContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StudioSessionContext
    return parsed.sessionId === sessionId ? parsed : null
  } catch {
    return null
  }
}

export function clearStudioContext(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
