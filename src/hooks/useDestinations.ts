import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createPersistedDestination,
  deletePersistedDestination,
  getTenantConfiguration,
} from '@/api/persistence'
import {
  deletePlatformConnection,
  disconnectPlatformConnection,
  getTwitchAuthorizeUrl,
  importPlatformConnectionFromEmbed,
  refreshPlatformConnection,
} from '@/api/integrations'
import { ApiError } from '@/api/client'
import { useCmsEmbedBridge } from '@/context/CmsEmbedBridgeProvider'
import { useTenant } from '@/context/TenantProvider'
import type { EmbedPlatform, PlatformConnectionPayload } from '@/lib/integration/cmsEmbedProtocol'
import { isEmbeddedIntegration } from '@/lib/integration/integrationMode'
import { mapEmbedPayloadToImportRequest } from '@/lib/integration/mapEmbedPlatformImport'
import { isPersistenceEnabled } from '@/lib/tenantEnv'
import {
  createTwitchOAuthSession,
  openTwitchOAuthPopup,
  twitchOAuthReturnUrl,
  twitchOAuthSucceededSince,
  waitForTwitchOAuthPopup,
} from '@/lib/twitchOAuthPopup'
import type {
  ConnectedDestination,
  CustomRTMPFormValues,
  DestinationPlatform,
  DestinationStatus,
  FacebookTarget,
} from '@/types/destinations'
import { DestinationPlatform as Platform, DestinationStatus as Status } from '@/types/destinations'
import type { PersistedDestination, PersistedPlatformConnection } from '@/types/persistence'

function mapPlatformConnection(connection: PersistedPlatformConnection): ConnectedDestination {
  const accountType = connection.metadata?.account_type
  const facebookTarget =
    accountType === 'Page' || accountType === 'page'
      ? ('page' as const)
      : accountType === 'profile' || accountType === 'Profile'
        ? ('profile' as const)
        : undefined

  return {
    id: connection.connection_id,
    platform: connection.platform as DestinationPlatform,
    name: connection.name,
    status: connection.status as DestinationStatus,
    facebookTarget,
    createdAt: connection.created_at,
  }
}

function mapCustomDestination(destination: PersistedDestination): ConnectedDestination {
  return {
    id: destination.destination_id,
    platform: Platform.CUSTOM_RTMP,
    name: destination.label || 'Custom RTMP',
    status: Status.CONNECTED,
    rtmpUrl: destination.url,
    createdAt: destination.created_at,
  }
}

function buildDestinationsFromConfig(
  platformConnections: PersistedPlatformConnection[] = [],
  persistedDestinations: PersistedDestination[] = [],
): ConnectedDestination[] {
  const linkedDestinationIds = new Set(
    platformConnections
      .map((c) => c.destination_id)
      .filter((id): id is string => Boolean(id)),
  )

  const customDestinations = persistedDestinations
    .filter(
      (d) =>
        d.platform === Platform.CUSTOM_RTMP ||
        (!linkedDestinationIds.has(d.destination_id) &&
          d.platform !== Platform.TWITCH &&
          d.platform !== Platform.YOUTUBE &&
          d.platform !== Platform.FACEBOOK),
    )
    .map(mapCustomDestination)

  return [...platformConnections.map(mapPlatformConnection), ...customDestinations]
}

export type FacebookPagePickerState = {
  pages: Array<{ id: string; name: string }>
  accountName?: string
  selectPage: (pageId: string) => Promise<boolean>
  cancel: () => void
}

export type ConnectFacebookResult = 'completed' | 'awaiting_page' | 'cancelled'

export interface UseDestinationsOptions {
  onTwitchConnected?: () => void
}

export function useDestinations(options?: UseDestinationsOptions) {
  const { tenantId, configuration, refreshConfiguration } = useTenant()
  const { requestPlatformConnect, requestFacebookConnect, cancelActivePlatformConnect } =
    useCmsEmbedBridge()
  const isEmbedded = isEmbeddedIntegration()
  const persistenceEnabled = isPersistenceEnabled()

  const syncedDestinations = useMemo(
    () =>
      buildDestinationsFromConfig(
        configuration?.platform_connections ?? [],
        configuration?.destinations ?? [],
      ),
    [configuration?.platform_connections, configuration?.destinations],
  )

  const [destinations, setDestinations] = useState<ConnectedDestination[]>(syncedDestinations)
  const [isConnecting, setIsConnecting] = useState(false)
  const [facebookPagePicker, setFacebookPagePicker] = useState<FacebookPagePickerState | null>(
    null,
  )

  useEffect(() => {
    setDestinations(syncedDestinations)
  }, [syncedDestinations])

  const reload = useCallback(async () => {
    if (persistenceEnabled) {
      await refreshConfiguration()
    }
  }, [persistenceEnabled, refreshConfiguration])

  const importEmbeddedPayload = useCallback(
    async (platform: EmbedPlatform, payload: PlatformConnectionPayload) => {
      if (!persistenceEnabled || !tenantId) {
        throw new Error('Persistence is not enabled')
      }
      await importPlatformConnectionFromEmbed(
        tenantId,
        mapEmbedPayloadToImportRequest(platform, payload),
      )
      await reload()
      options?.onTwitchConnected?.()
    },
    [persistenceEnabled, tenantId, reload, options?.onTwitchConnected],
  )

  const connectEmbeddedPlatform = useCallback(
    async (platform: EmbedPlatform) => {
      if (!persistenceEnabled || !tenantId) {
        toast.error('Persistence is not enabled')
        return
      }

      setIsConnecting(true)
      try {
        const payload = await requestPlatformConnect(platform, tenantId)
        await importEmbeddedPayload(platform, payload)
        const label = platform.charAt(0).toUpperCase() + platform.slice(1)
        toast.success(`${label} connected via CMS`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `${platform} connection failed`)
      } finally {
        setIsConnecting(false)
      }
    },
    [persistenceEnabled, tenantId, requestPlatformConnect, importEmbeddedPayload],
  )

  const clearFacebookPagePicker = useCallback(() => {
    setFacebookPagePicker(null)
    cancelActivePlatformConnect()
  }, [cancelActivePlatformConnect])

  const connectTwitch = useCallback(async () => {
    if (isEmbedded) {
      await connectEmbeddedPlatform('twitch')
      return
    }

    if (!persistenceEnabled || !tenantId) {
      toast.error('Persistence is not enabled')
      return
    }

    setIsConnecting(true)
    const oauthStartedAt = Date.now()
    try {
      const sessionId = createTwitchOAuthSession()
      const popupReturnUrl = twitchOAuthReturnUrl(sessionId)
      const { authorize_url } = await getTwitchAuthorizeUrl(tenantId, popupReturnUrl)

      const popup = openTwitchOAuthPopup(authorize_url)
      if (!popup) {
        toast.message('Popup blocked — redirecting to Twitch')
        const { authorize_url: fallbackUrl } = await getTwitchAuthorizeUrl(
          tenantId,
          window.location.href,
        )
        window.location.href = fallbackUrl
        return
      }

      const outcome = await waitForTwitchOAuthPopup(popup, sessionId)

      if (outcome.result === 'connected') {
        await reload()
        options?.onTwitchConnected?.()
        toast.success('Twitch connected successfully')
        return
      }

      if (outcome.result === 'error') {
        toast.error(
          outcome.message
            ? decodeURIComponent(outcome.message.replace(/\+/g, ' '))
            : 'Twitch connection failed',
        )
        return
      }

      // Signaling can fail even when persistence saved the connection — verify backend.
      await reload()
      const freshConfig = await getTenantConfiguration(tenantId)
      if (twitchOAuthSucceededSince(freshConfig.platform_connections ?? [], oauthStartedAt)) {
        options?.onTwitchConnected?.()
        toast.success('Twitch connected successfully')
        return
      }

      toast.message('Twitch connection cancelled')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to start Twitch authorization')
    } finally {
      setIsConnecting(false)
    }
  }, [
    isEmbedded,
    connectEmbeddedPlatform,
    persistenceEnabled,
    tenantId,
    reload,
    options?.onTwitchConnected,
  ])

  const connectYouTube = useCallback(async () => {
    if (isEmbedded) {
      await connectEmbeddedPlatform('youtube')
      return
    }
    toast.info('YouTube integration coming soon')
  }, [isEmbedded, connectEmbeddedPlatform])

  const connectFacebook = useCallback(
    async (target: FacebookTarget): Promise<ConnectFacebookResult> => {
      if (!isEmbedded) {
        toast.info('Facebook integration coming soon')
        return 'completed'
      }

      if (!persistenceEnabled || !tenantId) {
        toast.error('Persistence is not enabled')
        return 'cancelled'
      }

      clearFacebookPagePicker()
      setIsConnecting(true)
      try {
        const flow = await requestFacebookConnect(target, tenantId)

        if (flow.status === 'connected') {
          await importEmbeddedPayload('facebook', flow.payload)
          toast.success('Facebook connected via CMS')
          return 'completed'
        }

        setIsConnecting(false)
        setFacebookPagePicker({
          pages: flow.pages,
          accountName: flow.accountName,
          selectPage: async (pageId: string) => {
            setIsConnecting(true)
            try {
              const payload = await flow.selectPage(pageId)
              await importEmbeddedPayload('facebook', payload)
              setFacebookPagePicker(null)
              toast.success('Facebook connected via CMS')
              return true
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Facebook connection failed')
              return false
            } finally {
              setIsConnecting(false)
            }
          },
          cancel: () => {
            clearFacebookPagePicker()
            setIsConnecting(false)
          },
        })
        return 'awaiting_page'
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Facebook connection failed')
        return 'cancelled'
      } finally {
        setIsConnecting(false)
      }
    },
    [
      isEmbedded,
      persistenceEnabled,
      tenantId,
      requestFacebookConnect,
      importEmbeddedPayload,
      clearFacebookPagePicker,
    ],
  )

  const connectCustomRTMP = useCallback(
    async (values: CustomRTMPFormValues) => {
      if (!persistenceEnabled || !tenantId) {
        toast.error('Persistence is not enabled')
        return
      }

      setIsConnecting(true)
      const rtmpUrl = values.rtmpUrl.trim().replace(/\/$/, '')
      const fullUrl = `${rtmpUrl}/${values.streamKey.trim()}`

      try {
        await createPersistedDestination(tenantId, {
          label: values.displayName.trim(),
          url: fullUrl,
          platform: Platform.CUSTOM_RTMP,
        })
        await reload()
        toast.success(`${values.displayName} saved`)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to save RTMP destination')
      } finally {
        setIsConnecting(false)
      }
    },
    [persistenceEnabled, tenantId, reload],
  )

  const removeDestination = useCallback(
    async (id: string) => {
      if (!persistenceEnabled || !tenantId) {
        setDestinations((prev) => prev.filter((d) => d.id !== id))
        return
      }

      const connection = configuration?.platform_connections?.find((c) => c.connection_id === id)
      try {
        if (connection) {
          await deletePlatformConnection(tenantId, id)
        } else {
          await deletePersistedDestination(tenantId, id)
        }
        await reload()
        toast.success('Destination removed')
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to remove destination')
      }
    },
    [configuration?.platform_connections, persistenceEnabled, tenantId, reload],
  )

  const disconnectDestination = useCallback(
    async (id: string) => {
      if (!persistenceEnabled || !tenantId) {
        setDestinations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: Status.DISCONNECTED } : d)),
        )
        toast.success('Destination disconnected')
        return
      }

      try {
        await disconnectPlatformConnection(tenantId, id)
        await reload()
        toast.success('Destination disconnected')
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to disconnect destination')
      }
    },
    [persistenceEnabled, tenantId, reload],
  )

  const reconnectDestination = useCallback(
    async (id: string) => {
      const destination = destinations.find((d) => d.id === id)
      if (destination?.platform === Platform.TWITCH) {
        await connectTwitch()
        return
      }
      if (isEmbedded && destination?.platform === Platform.YOUTUBE) {
        await connectEmbeddedPlatform('youtube')
        return
      }
      if (isEmbedded && destination?.platform === Platform.FACEBOOK) {
        await connectFacebook(destination.facebookTarget ?? 'profile')
        return
      }

      if (!persistenceEnabled || !tenantId) {
        setDestinations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: Status.CONNECTED } : d)),
        )
        toast.success('Destination reconnected')
        return
      }

      try {
        await refreshPlatformConnection(tenantId, id)
        await reload()
        toast.success('Destination reconnected')
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to reconnect destination')
      }
    },
    [connectTwitch, connectFacebook, connectEmbeddedPlatform, destinations, isEmbedded, persistenceEnabled, tenantId, reload],
  )

  return {
    destinations,
    isConnecting,
    facebookPagePicker,
    clearFacebookPagePicker,
    connectYouTube,
    connectFacebook,
    connectTwitch,
    connectCustomRTMP,
    removeDestination,
    disconnectDestination,
    reconnectDestination,
    reload,
  }
}
