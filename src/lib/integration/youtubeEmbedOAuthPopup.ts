const YOUTUBE_OAUTH_POPUP = 'youtube-oauth'
const POPUP_FEATURES = 'popup=yes,width=500,height=700,scrollbars=yes,resizable=yes'

/** Open synchronously from a user click handler (before any await). */
export function openYouTubeOAuthPopup(): Window | null {
  try {
    return window.open('about:blank', YOUTUBE_OAUTH_POPUP, POPUP_FEATURES)
  } catch {
    return null
  }
}

export function navigateYouTubeOAuthPopup(popup: Window, authUrl: string): void {
  popup.location.href = authUrl
}

export interface YouTubeOAuthPopupMessage {
  type: 'google-auth-success' | 'google-auth-error'
  code?: string
  error?: string
  state?: string
}

export function isYouTubeOAuthPopupMessage(data: unknown): data is YouTubeOAuthPopupMessage {
  if (!data || typeof data !== 'object') return false
  const type = (data as { type?: unknown }).type
  return type === 'google-auth-success' || type === 'google-auth-error'
}

export function waitForYouTubeOAuthPopup(
  popup: Window,
  isAllowedOrigin: (origin: string) => boolean,
): Promise<{ code: string; state?: string }> {
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (!isAllowedOrigin(event.origin)) return
      if (!isYouTubeOAuthPopupMessage(event.data)) return

      if (event.data.type === 'google-auth-error') {
        cleanup()
        reject(new Error(typeof event.data.error === 'string' ? event.data.error : 'YouTube authorization failed'))
        return
      }

      const code = event.data.code
      if (!code) return

      cleanup()
      if (!popup.closed) {
        popup.close()
      }
      resolve({ code, state: event.data.state })
    }

    const pollId = window.setInterval(() => {
      if (!popup.closed) return
      cleanup()
      reject(new Error('YouTube authorization cancelled'))
    }, 500)

    const timeoutId = window.setTimeout(() => {
      cleanup()
      if (!popup.closed) {
        popup.close()
      }
      reject(new Error('YouTube authorization timed out'))
    }, 120_000)

    const cleanup = () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(pollId)
      window.clearTimeout(timeoutId)
    }

    window.addEventListener('message', onMessage)
  })
}
