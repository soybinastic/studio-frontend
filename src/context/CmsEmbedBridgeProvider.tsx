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
  type EmbedOutboundMessage,
  type EmbedPlatform,
  type EmbedReadyMessage,
  type PlatformConnectionPayload,
} from '@/lib/integration/cmsEmbedProtocol'
import {
  getEmbedParentOrigins,
  isAllowedEmbedParentOrigin,
  isEmbeddedIntegration,
} from '@/lib/integration/integrationMode'

interface PendingConnect {
  resolve: (payload: PlatformConnectionPayload) => void
  reject: (error: Error) => void
  platform: EmbedPlatform
}

interface CmsEmbedBridgeContextValue {
  isEmbedded: boolean
  delegatePlatforms: EmbedPlatform[]
  requestPlatformConnect: (
    platform: EmbedPlatform,
    tenantId?: string | null,
  ) => Promise<PlatformConnectionPayload>
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
        case 'studio-embed/v1/platform-connected': {
          const pending = pendingRef.current.get(event.data.requestId)
          if (pending) {
            pendingRef.current.delete(event.data.requestId)
            pending.resolve(event.data.payload)
          }
          break
        }
        case 'studio-embed/v1/platform-connect-failed': {
          const pending = pendingRef.current.get(event.data.requestId)
          if (pending) {
            pendingRef.current.delete(event.data.requestId)
            pending.reject(new Error(event.data.error || 'Platform connection failed'))
          }
          break
        }
        default:
          break
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isEmbedded])

  const requestPlatformConnect = useCallback(
    (platform: EmbedPlatform, connectTenantId?: string | null) => {
      if (!isEmbedded) {
        return Promise.reject(new Error('CMS embed bridge is only available in embedded mode'))
      }

      const requestId = createEmbedRequestId()
      const message: EmbedConnectPlatformMessage = {
        type: 'studio-embed/v1/connect-platform',
        requestId,
        platform,
        tenantId: connectTenantId ?? tenantId ?? undefined,
      }

      return new Promise<PlatformConnectionPayload>((resolve, reject) => {
        pendingRef.current.set(requestId, { resolve, reject, platform })
        postToParent(message)

        window.setTimeout(() => {
          if (!pendingRef.current.has(requestId)) return
          pendingRef.current.delete(requestId)
          reject(new Error('Platform connection timed out'))
        }, 120_000)
      })
    },
    [isEmbedded, tenantId],
  )

  const value = useMemo<CmsEmbedBridgeContextValue>(
    () => ({
      isEmbedded,
      delegatePlatforms,
      requestPlatformConnect,
    }),
    [isEmbedded, delegatePlatforms, requestPlatformConnect],
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
    }
  }
  return context
}

export function useCmsEmbedBridgeOptional(): CmsEmbedBridgeContextValue | null {
  return useContext(CmsEmbedBridgeContext)
}
