export const TWITCH_OAUTH_MESSAGE_TYPE = 'twitch-oauth-complete'
export const TWITCH_OAUTH_COMPLETE_PATH = '/oauth/twitch/complete'
export const TWITCH_OAUTH_BROADCAST_CHANNEL = 'studio-twitch-oauth'
export const TWITCH_OAUTH_LATEST_KEY = 'studio:twitch-oauth-result:latest'
export const TWITCH_OAUTH_FALLBACK_SESSION_ID = 'latest'

export interface TwitchOAuthResult {
  result: 'connected' | 'error' | 'cancelled'
  message?: string
  connectionId?: string
}

export interface TwitchOAuthMessage {
  type: typeof TWITCH_OAUTH_MESSAGE_TYPE
  sessionId?: string
  result: 'connected' | 'error'
  message?: string
  connectionId?: string
  at?: number
}

const POPUP_FEATURES = 'popup=yes,width=520,height=720,resizable=yes,scrollbars=yes'
const POPUP_TIMEOUT_MS = 5 * 60 * 1000
const POPUP_CLOSE_GRACE_MS = 1200
const STORAGE_POLL_MS = 100

function storageKey(sessionId: string): string {
  return `studio:twitch-oauth-result:${sessionId}`
}

export function createTwitchOAuthSession(): string {
  return crypto.randomUUID()
}

export function twitchOAuthReturnUrl(sessionId: string): string {
  const url = new URL(`${window.location.origin}${TWITCH_OAUTH_COMPLETE_PATH}`)
  url.searchParams.set('oauth_session', sessionId)
  return url.toString()
}

export function parseOAuthCompleteUrl(href: string): TwitchOAuthResult | null {
  try {
    const url = new URL(href)
    if (url.origin !== window.location.origin) return null
    if (url.pathname !== TWITCH_OAUTH_COMPLETE_PATH) return null

    const twitch = url.searchParams.get('twitch')
    if (twitch === 'connected') {
      return {
        result: 'connected',
        connectionId: url.searchParams.get('connection_id') ?? undefined,
      }
    }
    if (twitch === 'error') {
      return {
        result: 'error',
        message: url.searchParams.get('message') ?? undefined,
      }
    }
    return null
  } catch {
    return null
  }
}

export type TwitchOAuthPublishResult = {
  result: 'connected' | 'error'
  message?: string
  connectionId?: string
}

function buildPayload(sessionId: string, result: TwitchOAuthPublishResult) {
  return {
    sessionId,
    result: result.result,
    message: result.message,
    connectionId: result.connectionId,
    at: Date.now(),
  }
}

export function publishTwitchOAuthResult(
  sessionId: string,
  result: TwitchOAuthPublishResult,
): void {
  const payload = buildPayload(sessionId, result)
  const serialized = JSON.stringify(payload)

  localStorage.setItem(storageKey(sessionId), serialized)
  localStorage.setItem(TWITCH_OAUTH_LATEST_KEY, serialized)

  try {
    const channel = new BroadcastChannel(TWITCH_OAUTH_BROADCAST_CHANNEL)
    channel.postMessage({
      type: TWITCH_OAUTH_MESSAGE_TYPE,
      ...payload,
    })
    channel.close()
  } catch {
    // BroadcastChannel unavailable — localStorage polling still works.
  }
}

/** Publish OAuth result from the URL before React mounts (complete page). */
export function bootstrapTwitchOAuthFromLocation(): boolean {
  const oauthResult = parseOAuthCompleteUrl(window.location.href)
  if (!oauthResult || oauthResult.result === 'cancelled') {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('oauth_session') ?? TWITCH_OAUTH_FALLBACK_SESSION_ID

  publishTwitchOAuthResult(sessionId, {
    result: oauthResult.result,
    message: oauthResult.message,
    connectionId: oauthResult.connectionId,
  })

  return true
}

function readStoredPayload(sessionId: string): Partial<TwitchOAuthMessage> | null {
  const raw = localStorage.getItem(storageKey(sessionId))
  if (raw) {
    try {
      return JSON.parse(raw) as Partial<TwitchOAuthMessage>
    } catch {
      localStorage.removeItem(storageKey(sessionId))
    }
  }

  const latestRaw = localStorage.getItem(TWITCH_OAUTH_LATEST_KEY)
  if (!latestRaw) return null

  try {
    const latest = JSON.parse(latestRaw) as Partial<TwitchOAuthMessage>
    if (!latest.sessionId || latest.sessionId === sessionId) {
      return latest
    }
  } catch {
    localStorage.removeItem(TWITCH_OAUTH_LATEST_KEY)
  }

  return null
}

function clearStoredPayload(sessionId: string) {
  localStorage.removeItem(storageKey(sessionId))
  const latestRaw = localStorage.getItem(TWITCH_OAUTH_LATEST_KEY)
  if (!latestRaw) return
  try {
    const latest = JSON.parse(latestRaw) as Partial<TwitchOAuthMessage>
    if (latest.sessionId === sessionId) {
      localStorage.removeItem(TWITCH_OAUTH_LATEST_KEY)
    }
  } catch {
    localStorage.removeItem(TWITCH_OAUTH_LATEST_KEY)
  }
}

function closePopup(popup: Window) {
  try {
    if (!popup.closed) {
      popup.close()
    }
  } catch {
    // ignore
  }
}

function resultFromPayload(data: Partial<TwitchOAuthMessage>): TwitchOAuthResult | null {
  if (data.result === 'connected') {
    return {
      result: 'connected',
      connectionId: data.connectionId,
    }
  }
  if (data.result === 'error') {
    return {
      result: 'error',
      message: data.message,
    }
  }
  return null
}

export function waitForTwitchOAuthPopup(popup: Window, sessionId: string): Promise<TwitchOAuthResult> {
  return new Promise((resolve) => {
    let settled = false
    let channel: BroadcastChannel | null = null
    let closeGraceTimer: number | null = null

    const finish = (result: TwitchOAuthResult) => {
      if (settled) return
      settled = true
      window.clearInterval(storagePoll)
      window.clearInterval(closedPoll)
      window.clearTimeout(timeoutId)
      if (closeGraceTimer !== null) {
        window.clearTimeout(closeGraceTimer)
      }
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
      clearStoredPayload(sessionId)
      channel?.close()
      closePopup(popup)
      resolve(result)
    }

    const finishFromPayload = (data: Partial<TwitchOAuthMessage> | null) => {
      if (!data) return
      if (data.sessionId && data.sessionId !== sessionId) return
      const parsed = resultFromPayload(data)
      if (parsed) finish(parsed)
    }

    const tryReadStorage = () => {
      finishFromPayload(readStoredPayload(sessionId))
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as Partial<TwitchOAuthMessage>
      if (data?.type !== TWITCH_OAUTH_MESSAGE_TYPE) return
      finishFromPayload(data)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return
      if (event.key !== storageKey(sessionId) && event.key !== TWITCH_OAUTH_LATEST_KEY) return
      tryReadStorage()
    }

    const storagePoll = window.setInterval(tryReadStorage, STORAGE_POLL_MS)

    const scheduleCancelled = () => {
      if (closeGraceTimer !== null) return
      closeGraceTimer = window.setTimeout(() => {
        tryReadStorage()
        if (!settled) {
          finish({ result: 'cancelled' })
        }
      }, POPUP_CLOSE_GRACE_MS)
    }

    const closedPoll = window.setInterval(() => {
      if (popup.closed) {
        tryReadStorage()
        if (!settled) {
          scheduleCancelled()
        }
      }
    }, 200)

    const timeoutId = window.setTimeout(() => {
      finish({ result: 'cancelled' })
    }, POPUP_TIMEOUT_MS)

    try {
      channel = new BroadcastChannel(TWITCH_OAUTH_BROADCAST_CHANNEL)
      channel.onmessage = (event: MessageEvent<Partial<TwitchOAuthMessage>>) => {
        const data = event.data
        if (data?.type !== TWITCH_OAUTH_MESSAGE_TYPE) return
        finishFromPayload(data)
      }
    } catch {
      channel = null
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('storage', onStorage)
    tryReadStorage()
  })
}

export function openTwitchOAuthPopup(authorizeUrl: string): Window | null {
  return window.open(authorizeUrl, 'twitch-oauth', POPUP_FEATURES)
}

export function twitchOAuthSucceededSince(
  connections: Array<{ platform: string; status: string; updated_at: string }>,
  startedAtMs: number,
): boolean {
  return connections.some(
    (connection) =>
      connection.platform === 'twitch' &&
      connection.status === 'connected' &&
      Date.parse(connection.updated_at) >= startedAtMs - 10_000,
  )
}
