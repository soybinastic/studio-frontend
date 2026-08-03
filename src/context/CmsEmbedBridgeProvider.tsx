import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createEmbedRequestId,
  isEmbedInboundMessage,
  type EmbedConnectPlatformMessage,
  type EmbedFacebookPageOption,
  type EmbedOutboundMessage,
  type EmbedPlatform,
  type EmbedReadyMessage,
  type EmbedRefreshFacebookLiveMessage,
  type EmbedRefreshYouTubeLiveMessage,
  type FacebookEmbedTarget,
  type FacebookLiveRefreshHints,
  type YouTubeLiveRefreshHints,
  type PlatformConnectionPayload,
} from '@/lib/integration/cmsEmbedProtocol'
import {
  getEmbedParentOrigins,
  isAllowedEmbedParentOrigin,
  isEmbeddedIntegration,
} from '@/lib/integration/integrationMode'
import {
  navigateYouTubeOAuthPopup,
  openYouTubeOAuthPopup,
  waitForYouTubeOAuthPopup,
} from '@/lib/integration/youtubeEmbedOAuthPopup'
import type { EmbedYouTubeOAuthCodeMessage } from '@/lib/integration/cmsEmbedProtocol'

const CONNECT_TIMEOUT_MS = 120_000
const FACEBOOK_PAGE_TIMEOUT_MS = 5 * 60 * 1000
const FACEBOOK_REFRESH_TIMEOUT_MS = 60_000
const YOUTUBE_REFRESH_TIMEOUT_MS = 90_000

interface PendingYouTubePopup {
  requestId: string
  popup: Window
  generation: number
}

interface PendingConnect {
  resolve: (payload: PlatformConnectionPayload) => void
  reject: (error: Error) => void
  platform: EmbedPlatform
  generation: number
  timeoutId: number
}

interface PendingEmbedRefresh {
  resolve: (payload: PlatformConnectionPayload) => void
  reject: (error: Error) => void
  generation: number
  timeoutId: number
}

interface PendingFacebookPages {
  requestId: string
  pages: EmbedFacebookPageOption[]
  accountName?: string
  generation: number
  resolveSelect: (payload: PlatformConnectionPayload) => void
  rejectSelect: (error: Error) => void
  selectTimeoutId: number
}

export type FacebookConnectFlowResult =
  | { status: 'connected'; payload: PlatformConnectionPayload }
  | {
      status: 'awaiting_page'
      requestId: string
      pages: EmbedFacebookPageOption[]
      accountName?: string
      selectPage: (pageId: string) => Promise<PlatformConnectionPayload>
    }

export interface PlatformConnectOptions {
  facebookTarget?: FacebookEmbedTarget
}

interface CmsEmbedBridgeContextValue {
  isEmbedded: boolean
  delegatePlatforms: EmbedPlatform[]
  requestPlatformConnect: (
    platform: EmbedPlatform,
    tenantId?: string | null,
    options?: PlatformConnectOptions,
  ) => Promise<PlatformConnectionPayload>
  requestFacebookConnect: (
    facebookTarget: FacebookEmbedTarget,
    tenantId?: string | null,
  ) => Promise<FacebookConnectFlowResult>
  requestFacebookLiveRefresh: (hints: FacebookLiveRefreshHints) => Promise<PlatformConnectionPayload>
  requestYouTubeLiveRefresh: (hints: YouTubeLiveRefreshHints) => Promise<PlatformConnectionPayload>
  cancelActivePlatformConnect: () => void
}

const CmsEmbedBridgeContext = createContext<CmsEmbedBridgeContextValue | null>(null)

function postToParent(message: EmbedOutboundMessage): void {
  if (window.parent === window) return

  const allowedOrigins = getEmbedParentOrigins()
  const targetOrigin = allowedOrigins[0] ?? '*'

  window.parent.postMessage(message, targetOrigin)
}

export function CmsEmbedBridgeProvider({
  children,
  sessionId,
  tenantId,
}: {
  children: ReactNode
  sessionId?: string
  tenantId?: string | null
}) {
  const isEmbedded = isEmbeddedIntegration()
  const [delegatePlatforms, setDelegatePlatforms] = useState<EmbedPlatform[]>([])
  const pendingRef = useRef<Map<string, PendingConnect>>(new Map())
  const pendingRefreshRef = useRef<Map<string, PendingEmbedRefresh>>(new Map())
  const facebookPagesRef = useRef<PendingFacebookPages | null>(null)
  const youtubePopupRef = useRef<PendingYouTubePopup | null>(null)
  const connectGenerationRef = useRef(0)
  const refreshGenerationRef = useRef(0)
  const activeRequestIdRef = useRef<string | null>(null)

  const clearPendingConnect = useCallback((requestId: string) => {
    const pending = pendingRef.current.get(requestId)
    if (!pending) return
    window.clearTimeout(pending.timeoutId)
    pendingRef.current.delete(requestId)
  }, [])

  const clearPendingRefresh = useCallback((requestId: string) => {
    const pending = pendingRefreshRef.current.get(requestId)
    if (!pending) return
    window.clearTimeout(pending.timeoutId)
    pendingRefreshRef.current.delete(requestId)
  }, [])

  const clearFacebookPagesSession = useCallback(() => {
    const session = facebookPagesRef.current
    if (!session) return
    window.clearTimeout(session.selectTimeoutId)
    facebookPagesRef.current = null
  }, [])

  const clearYouTubePopupSession = useCallback(() => {
    const session = youtubePopupRef.current
    if (!session) return
    if (!session.popup.closed) {
      session.popup.close()
    }
    youtubePopupRef.current = null
  }, [])

  const cancelActivePlatformConnect = useCallback(() => {
    connectGenerationRef.current += 1
    const requestId = activeRequestIdRef.current
    activeRequestIdRef.current = null

    if (requestId) {
      postToParent({
        type: 'studio-embed/v1/cancel-platform-connect',
        requestId,
      })
      const pending = pendingRef.current.get(requestId)
      if (pending) {
        clearPendingConnect(requestId)
        pending.reject(new Error('Platform connection cancelled'))
      }
    }

    const facebookSession = facebookPagesRef.current
    if (facebookSession) {
      clearFacebookPagesSession()
      facebookSession.rejectSelect(new Error('Facebook page selection cancelled'))
    }

    clearYouTubePopupSession()
  }, [clearFacebookPagesSession, clearPendingConnect, clearYouTubePopupSession])

  const completeYouTubePopupOAuth = useCallback(
    async (session: PendingYouTubePopup) => {
      try {
        const { code, state } = await waitForYouTubeOAuthPopup(
          session.popup,
          isAllowedEmbedParentOrigin,
        )

        const message: EmbedYouTubeOAuthCodeMessage = {
          type: 'studio-embed/v1/youtube-oauth-code',
          requestId: session.requestId,
          code,
          state,
        }
        postToParent(message)
      } catch (err) {
        const pending = pendingRef.current.get(session.requestId)
        if (pending && pending.generation === session.generation) {
          clearPendingConnect(session.requestId)
          activeRequestIdRef.current = null
          pending.reject(err instanceof Error ? err : new Error('YouTube connection failed'))
        }
      } finally {
        if (youtubePopupRef.current?.requestId === session.requestId) {
          youtubePopupRef.current = null
        }
      }
    },
    [clearPendingConnect],
  )

  useEffect(() => {
    if (!isEmbedded) return

    const ready: EmbedReadyMessage = {
      type: 'studio-embed/v1/ready',
      sessionId,
      tenantId: tenantId ?? undefined,
    }
    postToParent(ready)
  }, [isEmbedded, sessionId, tenantId])

  useEffect(() => {
    if (!isEmbedded) return

    const onMessage = (event: MessageEvent) => {
      if (!isAllowedEmbedParentOrigin(event.origin)) return
      if (!isEmbedInboundMessage(event.data)) return

      switch (event.data.type) {
        case 'studio-embed/v1/config':
          setDelegatePlatforms(event.data.delegatePlatforms ?? [])
          break
        case 'studio-embed/v1/facebook-pages': {
          const session = facebookPagesRef.current
          if (!session || session.requestId !== event.data.requestId) return
          if (session.generation !== connectGenerationRef.current) return

          const pending = pendingRef.current.get(event.data.requestId)
          if (pending) {
            window.clearTimeout(pending.timeoutId)
            pendingRef.current.delete(event.data.requestId)
          }

          window.clearTimeout(session.selectTimeoutId)
          session.selectTimeoutId = window.setTimeout(() => {
            if (facebookPagesRef.current?.requestId !== event.data.requestId) return
            cancelActivePlatformConnect()
          }, FACEBOOK_PAGE_TIMEOUT_MS)

          session.pages = event.data.pages
          session.accountName = event.data.accountName
          break
        }
        case 'studio-embed/v1/youtube-oauth-url': {
          const session = youtubePopupRef.current
          if (!session || session.requestId !== event.data.requestId) return
          if (session.generation !== connectGenerationRef.current) return

          navigateYouTubeOAuthPopup(session.popup, event.data.authUrl)
          void completeYouTubePopupOAuth(session)
          break
        }
        case 'studio-embed/v1/platform-connected': {
          const refreshPending = pendingRefreshRef.current.get(event.data.requestId)
          if (refreshPending) {
            if (refreshPending.generation !== refreshGenerationRef.current) return
            clearPendingRefresh(event.data.requestId)
            refreshPending.resolve(event.data.payload)
            break
          }

          const pending = pendingRef.current.get(event.data.requestId)
          if (pending) {
            if (pending.generation !== connectGenerationRef.current) return
            clearPendingConnect(event.data.requestId)
            activeRequestIdRef.current = null
            pending.resolve(event.data.payload)
          }

          const facebookSession = facebookPagesRef.current
          if (facebookSession && facebookSession.requestId === event.data.requestId) {
            if (facebookSession.generation !== connectGenerationRef.current) return
            clearFacebookPagesSession()
            activeRequestIdRef.current = null
            facebookSession.resolveSelect(event.data.payload)
          }
          break
        }
        case 'studio-embed/v1/platform-connect-failed': {
          const refreshPending = pendingRefreshRef.current.get(event.data.requestId)
          if (refreshPending) {
            if (refreshPending.generation !== refreshGenerationRef.current) return
            clearPendingRefresh(event.data.requestId)
            refreshPending.reject(new Error(event.data.error || 'Embed live refresh failed'))
            break
          }

          const pending = pendingRef.current.get(event.data.requestId)
          if (pending) {
            if (pending.generation !== connectGenerationRef.current) return
            clearPendingConnect(event.data.requestId)
            activeRequestIdRef.current = null
            pending.reject(new Error(event.data.error || 'Platform connection failed'))
          }

          const facebookSession = facebookPagesRef.current
          if (facebookSession && facebookSession.requestId === event.data.requestId) {
            if (facebookSession.generation !== connectGenerationRef.current) return
            clearFacebookPagesSession()
            activeRequestIdRef.current = null
            facebookSession.rejectSelect(new Error(event.data.error || 'Facebook connection failed'))
          }
          break
        }
        default:
          break
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [
    cancelActivePlatformConnect,
    clearFacebookPagesSession,
    clearPendingConnect,
    clearPendingRefresh,
    completeYouTubePopupOAuth,
    isEmbedded,
  ])

  const beginConnectSession = useCallback(
    (
      platform: EmbedPlatform,
      options?: PlatformConnectOptions & { youtubeFallbackRedirect?: boolean },
    ) => {
      cancelActivePlatformConnect()
      const generation = connectGenerationRef.current
      const requestId = createEmbedRequestId()
      activeRequestIdRef.current = requestId

      const message: EmbedConnectPlatformMessage = {
        type: 'studio-embed/v1/connect-platform',
        requestId,
        platform,
        tenantId: tenantId ?? undefined,
        facebookTarget: options?.facebookTarget,
        youtubeFallbackRedirect: options?.youtubeFallbackRedirect,
      }

      const connectPromise = new Promise<PlatformConnectionPayload>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          if (!pendingRef.current.has(requestId)) return
          if (connectGenerationRef.current !== generation) return
          clearPendingConnect(requestId)
          activeRequestIdRef.current = null
          reject(new Error('Platform connection timed out'))
        }, CONNECT_TIMEOUT_MS)

        pendingRef.current.set(requestId, {
          resolve,
          reject,
          platform,
          generation,
          timeoutId,
        })
      })

      if (options?.facebookTarget === 'page') {
        facebookPagesRef.current = {
          requestId,
          pages: [],
          generation,
          resolveSelect: () => undefined,
          rejectSelect: () => undefined,
          selectTimeoutId: 0,
        }
      }

      postToParent(message)
      return { requestId, generation, connectPromise }
    },
    [cancelActivePlatformConnect, clearPendingConnect, tenantId],
  )

  const requestYouTubePlatformConnect = useCallback(
    (connectTenantId?: string | null) => {
      if (!isEmbedded) {
        return Promise.reject(new Error('CMS embed bridge is only available in embedded mode'))
      }

      cancelActivePlatformConnect()

      const popup = openYouTubeOAuthPopup()
      const generation = connectGenerationRef.current
      const requestId = createEmbedRequestId()
      activeRequestIdRef.current = requestId

      const connectPromise = new Promise<PlatformConnectionPayload>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          if (!pendingRef.current.has(requestId)) return
          if (connectGenerationRef.current !== generation) return
          clearPendingConnect(requestId)
          activeRequestIdRef.current = null
          clearYouTubePopupSession()
          reject(new Error('YouTube connection timed out'))
        }, CONNECT_TIMEOUT_MS)

        pendingRef.current.set(requestId, {
          resolve,
          reject,
          platform: 'youtube',
          generation,
          timeoutId,
        })
      })

      if (popup) {
        youtubePopupRef.current = { requestId, popup, generation }
        postToParent({
          type: 'studio-embed/v1/connect-platform',
          requestId,
          platform: 'youtube',
          tenantId: connectTenantId ?? tenantId ?? undefined,
        })
      } else {
        postToParent({
          type: 'studio-embed/v1/connect-platform',
          requestId,
          platform: 'youtube',
          tenantId: connectTenantId ?? tenantId ?? undefined,
          youtubeFallbackRedirect: true,
        })
      }

      return connectPromise
    },
    [cancelActivePlatformConnect, clearPendingConnect, clearYouTubePopupSession, isEmbedded, tenantId],
  )

  const requestPlatformConnect = useCallback(
    (platform: EmbedPlatform, connectTenantId?: string | null, options?: PlatformConnectOptions) => {
      if (!isEmbedded) {
        return Promise.reject(new Error('CMS embed bridge is only available in embedded mode'))
      }

      if (platform === 'youtube') {
        return requestYouTubePlatformConnect(connectTenantId)
      }

      void connectTenantId
      const { connectPromise } = beginConnectSession(platform, options)
      return connectPromise
    },
    [beginConnectSession, isEmbedded, requestYouTubePlatformConnect],
  )

  const waitForFacebookPages = useCallback(
    (requestId: string, generation: number, connectPromise: Promise<PlatformConnectionPayload>) =>
      new Promise<{ pages: EmbedFacebookPageOption[]; accountName?: string }>((resolve, reject) => {
        const pollInterval = window.setInterval(() => {
          const session = facebookPagesRef.current
          if (!session || session.requestId !== requestId) return
          if (session.generation !== generation) return
          if (session.pages.length === 0) return

          window.clearInterval(pollInterval)
          resolve({
            pages: session.pages,
            accountName: session.accountName,
          })
        }, 50)

        connectPromise.catch((err: unknown) => {
          window.clearInterval(pollInterval)
          reject(err instanceof Error ? err : new Error('Facebook connection failed'))
        })

        window.setTimeout(() => {
          window.clearInterval(pollInterval)
          reject(new Error('Timed out waiting for Facebook pages'))
        }, CONNECT_TIMEOUT_MS)
      }),
    [],
  )

  const requestFacebookConnect = useCallback(
    async (
      facebookTarget: FacebookEmbedTarget,
      connectTenantId?: string | null,
    ): Promise<FacebookConnectFlowResult> => {
      if (!isEmbedded) {
        throw new Error('CMS embed bridge is only available in embedded mode')
      }

      void connectTenantId

      if (facebookTarget === 'profile') {
        const payload = await requestPlatformConnect('facebook', connectTenantId, {
          facebookTarget: 'profile',
        })
        return { status: 'connected', payload }
      }

      const { requestId, generation, connectPromise } = beginConnectSession('facebook', {
        facebookTarget: 'page',
      })

      try {
        const pagesOutcome = await waitForFacebookPages(requestId, generation, connectPromise)

        if (connectGenerationRef.current !== generation) {
          throw new Error('Facebook connection superseded')
        }

        return {
          status: 'awaiting_page',
          requestId,
          pages: pagesOutcome.pages,
          accountName: pagesOutcome.accountName,
          selectPage: (pageId: string) => {
            if (connectGenerationRef.current !== generation) {
              return Promise.reject(new Error('Facebook connection superseded'))
            }
            if (activeRequestIdRef.current !== requestId) {
              return Promise.reject(new Error('Facebook page selection session expired'))
            }

            return new Promise<PlatformConnectionPayload>((resolve, reject) => {
              const selectTimeoutId = window.setTimeout(() => {
                if (facebookPagesRef.current?.requestId !== requestId) return
                cancelActivePlatformConnect()
                reject(new Error('Facebook page selection timed out'))
              }, FACEBOOK_PAGE_TIMEOUT_MS)

              facebookPagesRef.current = {
                requestId,
                pages: pagesOutcome.pages,
                accountName: pagesOutcome.accountName,
                generation,
                resolveSelect: resolve,
                rejectSelect: reject,
                selectTimeoutId,
              }

              postToParent({
                type: 'studio-embed/v1/select-facebook-page',
                requestId,
                pageId,
              })
            })
          },
        }
      } catch (err) {
        clearFacebookPagesSession()
        throw err
      }
    },
    [
      beginConnectSession,
      cancelActivePlatformConnect,
      clearFacebookPagesSession,
      isEmbedded,
      requestPlatformConnect,
      waitForFacebookPages,
    ],
  )

  const requestFacebookLiveRefresh = useCallback(
    (hints: FacebookLiveRefreshHints) => {
      if (!isEmbedded) {
        return Promise.reject(new Error('CMS embed bridge is only available in embedded mode'))
      }

      refreshGenerationRef.current += 1
      const generation = refreshGenerationRef.current
      const requestId = createEmbedRequestId()

      const message: EmbedRefreshFacebookLiveMessage = {
        type: 'studio-embed/v1/refresh-facebook-live',
        requestId,
        tenantId: tenantId ?? undefined,
        accessToken: hints.accessToken,
        streamingTargetId: hints.streamingTargetId,
        facebookUserId: hints.facebookUserId,
        pageId: hints.pageId,
        accountType: hints.accountType,
        accountName: hints.accountName,
        platformLogin: hints.platformLogin,
        tokenExpiresAt: hints.tokenExpiresAt,
      }

      const refreshPromise = new Promise<PlatformConnectionPayload>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          if (!pendingRefreshRef.current.has(requestId)) return
          if (refreshGenerationRef.current !== generation) return
          clearPendingRefresh(requestId)
          reject(new Error('Facebook live refresh timed out'))
        }, FACEBOOK_REFRESH_TIMEOUT_MS)

        pendingRefreshRef.current.set(requestId, {
          resolve,
          reject,
          generation,
          timeoutId,
        })
      })

      postToParent(message)
      return refreshPromise
    },
    [clearPendingRefresh, isEmbedded, tenantId],
  )

  const requestYouTubeLiveRefresh = useCallback(
    (hints: YouTubeLiveRefreshHints) => {
      if (!isEmbedded) {
        return Promise.reject(new Error('CMS embed bridge is only available in embedded mode'))
      }

      refreshGenerationRef.current += 1
      const generation = refreshGenerationRef.current
      const requestId = createEmbedRequestId()

      const message: EmbedRefreshYouTubeLiveMessage = {
        type: 'studio-embed/v1/refresh-youtube-live',
        requestId,
        tenantId: tenantId ?? undefined,
        accessToken: hints.accessToken,
        refreshToken: hints.refreshToken,
        channelId: hints.channelId,
        accountName: hints.accountName,
        platformLogin: hints.platformLogin,
        tokenExpiresAt: hints.tokenExpiresAt,
        title: hints.title,
        description: hints.description,
      }

      const refreshPromise = new Promise<PlatformConnectionPayload>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          if (!pendingRefreshRef.current.has(requestId)) return
          if (refreshGenerationRef.current !== generation) return
          clearPendingRefresh(requestId)
          reject(new Error('YouTube live refresh timed out'))
        }, YOUTUBE_REFRESH_TIMEOUT_MS)

        pendingRefreshRef.current.set(requestId, {
          resolve,
          reject,
          generation,
          timeoutId,
        })
      })

      postToParent(message)
      return refreshPromise
    },
    [clearPendingRefresh, isEmbedded, tenantId],
  )

  const value = useMemo<CmsEmbedBridgeContextValue>(
    () => ({
      isEmbedded,
      delegatePlatforms,
      requestPlatformConnect,
      requestFacebookConnect,
      requestFacebookLiveRefresh,
      requestYouTubeLiveRefresh,
      cancelActivePlatformConnect,
    }),
    [
      isEmbedded,
      delegatePlatforms,
      requestPlatformConnect,
      requestFacebookConnect,
      requestFacebookLiveRefresh,
      requestYouTubeLiveRefresh,
      cancelActivePlatformConnect,
    ],
  )

  return (
    <CmsEmbedBridgeContext.Provider value={value}>{children}</CmsEmbedBridgeContext.Provider>
  )
}

export function useCmsEmbedBridge(): CmsEmbedBridgeContextValue {
  const context = useContext(CmsEmbedBridgeContext)
  if (!context) {
    return {
      isEmbedded: false,
      delegatePlatforms: [],
      requestPlatformConnect: () =>
        Promise.reject(new Error('CmsEmbedBridgeProvider is not mounted')),
      requestFacebookConnect: () =>
        Promise.reject(new Error('CmsEmbedBridgeProvider is not mounted')),
      requestFacebookLiveRefresh: () =>
        Promise.reject(new Error('CmsEmbedBridgeProvider is not mounted')),
      requestYouTubeLiveRefresh: () =>
        Promise.reject(new Error('CmsEmbedBridgeProvider is not mounted')),
      cancelActivePlatformConnect: () => undefined,
    }
  }
  return context
}

export function useCmsEmbedBridgeOptional(): CmsEmbedBridgeContextValue | null {
  return useContext(CmsEmbedBridgeContext)
}
