import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  bootstrapTwitchOAuthFromLocation,
  TWITCH_OAUTH_MESSAGE_TYPE,
} from '@/lib/twitchOAuthPopup'

/**
 * Popup landing page after persistence OAuth callback.
 * Result is published before React mounts; this page closes the popup.
 */
export function TwitchOAuthCompletePage() {
  const [status, setStatus] = useState<'pending' | 'done' | 'standalone'>(() =>
    bootstrapTwitchOAuthFromLocation() ? 'done' : 'standalone',
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const twitchResult = params.get('twitch')
    if (!twitchResult) return

    const payload = {
      type: TWITCH_OAUTH_MESSAGE_TYPE,
      sessionId: params.get('oauth_session') ?? undefined,
      result: twitchResult === 'connected' ? ('connected' as const) : ('error' as const),
      message: params.get('message') ?? undefined,
      connectionId: params.get('connection_id') ?? undefined,
    }

    bootstrapTwitchOAuthFromLocation()

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin)
    }

    setStatus('done')
    window.setTimeout(() => {
      window.close()
    }, 400)
  }, [])

  if (status === 'standalone') {
    const params = new URLSearchParams(window.location.search)
    const twitchResult = params.get('twitch')
    const message = params.get('message')

    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-medium">
          {twitchResult === 'connected' ? 'Twitch connected' : 'Twitch connection'}
        </p>
        <p className="text-sm text-muted-foreground">
          {twitchResult === 'error'
            ? message?.replace(/\+/g, ' ') ?? 'Connection failed. Return to the studio and try again.'
            : twitchResult === 'connected'
              ? 'You can close this tab and return to the studio.'
              : 'Missing OAuth result. Return to the studio and try again.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Finishing Twitch connection…</p>
    </div>
  )
}
