import {
  refreshPlatformConnection,
  importPlatformConnectionFromEmbed,
  getFacebookEmbedCredentials,
  type FacebookEmbedCredentials,
} from '@/api/integrations'
import type { StreamDestinationInput } from '@/api/streaming'
import { DestinationPlatform as Platform } from '@/types/destinations'
import type { PersistedDestination, PersistedPlatformConnection } from '@/types/persistence'
import type {
  FacebookLiveRefreshHints,
  PlatformConnectionPayload,
} from '@/lib/integration/cmsEmbedProtocol'
import { mapEmbedPayloadToImportRequest } from '@/lib/integration/mapEmbedPlatformImport'

export const STREAMABLE_CONNECTION_STATUSES = new Set(['connected', 'streaming'])

const CMS_EMBED_SOURCES = new Set(['cms_oauth', 'cms_embed'])

export function shouldSkipTwitchStreamKeyRefresh(
  connection: PersistedPlatformConnection,
): boolean {
  const source = connection.metadata?.source
  return (
    connection.platform === Platform.TWITCH &&
    connection.has_stream_key &&
    typeof source === 'string' &&
    CMS_EMBED_SOURCES.has(source)
  )
}

export function shouldRefreshFacebookStreamKeyOnGoLive(
  connection: PersistedPlatformConnection,
): boolean {
  const source = connection.metadata?.source
  return (
    connection.platform === Platform.FACEBOOK &&
    connection.has_stream_key &&
    typeof source === 'string' &&
    CMS_EMBED_SOURCES.has(source)
  )
}

function buildFacebookRefreshHints(
  connection: PersistedPlatformConnection,
  credentials: FacebookEmbedCredentials,
): FacebookLiveRefreshHints {
  const metadata = {
    ...(connection.metadata ?? {}),
    ...(credentials.metadata ?? {}),
  }
  const accountTypeRaw = metadata.account_type
  const accountType =
    typeof accountTypeRaw === 'string' && accountTypeRaw.toLowerCase() === 'page'
      ? 'page'
      : 'profile'
  const pageId = typeof metadata.page_id === 'string' ? metadata.page_id : undefined
  const facebookUserId =
    typeof metadata.facebook_user_id === 'string'
      ? metadata.facebook_user_id
      : connection.platform_user_id

  const streamingTargetId =
    accountType === 'page' && pageId
      ? pageId
      : credentials.platform_user_id || connection.platform_user_id

  return {
    accessToken: credentials.access_token,
    streamingTargetId,
    accountType,
    facebookUserId,
    pageId,
    accountName: credentials.name || connection.name,
    platformLogin: credentials.platform_login || connection.platform_login,
  }
}

export type FacebookLiveRefreshFn = (
  hints: FacebookLiveRefreshHints,
) => Promise<PlatformConnectionPayload>

function isStreamableConnection(connection: PersistedPlatformConnection): boolean {
  if (!connection.has_stream_key) return false
  if (STREAMABLE_CONNECTION_STATUSES.has(connection.status)) return true
  return connection.status === 'error' && shouldSkipTwitchStreamKeyRefresh(connection)
}

export function getStreamableDestinations(
  destinations: PersistedDestination[] = [],
  platformConnections: PersistedPlatformConnection[] = [],
): PersistedDestination[] {
  const connectionByDestinationId = new Map(
    platformConnections
      .filter((c) => c.destination_id)
      .map((c) => [c.destination_id as string, c]),
  )

  return destinations.filter((destination) => {
    const url = destination.url.trim()
    if (!url) return false

    const connection = connectionByDestinationId.get(destination.destination_id)
    if (connection) {
      return isStreamableConnection(connection)
    }

    return destination.platform === Platform.CUSTOM_RTMP
  })
}

export function toStreamDestinationInputs(
  destinations: PersistedDestination[],
): StreamDestinationInput[] {
  return destinations.map((destination) => ({
    url: destination.url.trim(),
    label: destination.label.trim() || destination.platform || 'Custom',
  }))
}

export function maskRtmpUrl(url: string): string {
  const trimmed = url.trim()
  const lastSlash = trimmed.lastIndexOf('/')
  if (lastSlash === -1) return trimmed
  return `${trimmed.slice(0, lastSlash + 1)}••••••••`
}

export async function refreshTwitchStreamKeys(
  tenantId: string,
  platformConnections: PersistedPlatformConnection[] = [],
): Promise<void> {
  const twitchConnections = platformConnections.filter(
    (connection) =>
      connection.platform === Platform.TWITCH &&
      STREAMABLE_CONNECTION_STATUSES.has(connection.status) &&
      !shouldSkipTwitchStreamKeyRefresh(connection),
  )

  await Promise.all(
    twitchConnections.map((connection) =>
      refreshPlatformConnection(tenantId, connection.connection_id).catch(() => undefined),
    ),
  )
}

export async function refreshFacebookStreamKeys(
  tenantId: string,
  platformConnections: PersistedPlatformConnection[] = [],
  refreshFn: FacebookLiveRefreshFn,
): Promise<void> {
  const facebookConnections = platformConnections.filter(
    (connection) =>
      connection.platform === Platform.FACEBOOK &&
      STREAMABLE_CONNECTION_STATUSES.has(connection.status) &&
      shouldRefreshFacebookStreamKeyOnGoLive(connection),
  )

  for (const connection of facebookConnections) {
    const credentials = await getFacebookEmbedCredentials(tenantId, connection.connection_id)
    const hints = buildFacebookRefreshHints(connection, credentials)
    const payload = await refreshFn(hints)
    await importPlatformConnectionFromEmbed(
      tenantId,
      mapEmbedPayloadToImportRequest('facebook', payload),
    )
  }
}

export function getConnectionForDestination(
  destinationId: string,
  platformConnections: PersistedPlatformConnection[] = [],
): PersistedPlatformConnection | undefined {
  return platformConnections.find((connection) => connection.destination_id === destinationId)
}

export function formatStreamDestinationSummary(destinations: StreamDestinationInput[]): string {
  if (destinations.length === 0) return 'destinations'
  if (destinations.length === 1) return destinations[0].label?.trim() || 'destination'
  return `${destinations.length} destinations`
}

export function hasFacebookStreamDestination(destinations: StreamDestinationInput[] = []): boolean {
  return destinations.some((destination) => {
    const url = destination.url.toLowerCase()
    const label = destination.label?.toLowerCase() ?? ''
    return url.includes('facebook.com') || label.includes('facebook')
  })
}

export function willStreamToFacebook(
  streamableDestinations: PersistedDestination[],
  selectedDestinations?: StreamDestinationInput[],
): boolean {
  const facebookSaved = streamableDestinations.filter(
    (destination) => destination.platform === Platform.FACEBOOK,
  )
  if (facebookSaved.length === 0) return false

  if (!selectedDestinations?.length) {
    return true
  }

  const selectedLabels = new Set(
    selectedDestinations.map((item) => item.label?.trim() || 'Custom'),
  )
  return facebookSaved.some((destination) =>
    selectedLabels.has(destination.label.trim() || destination.platform || 'Custom'),
  )
}

export function hasTwitchStreamDestination(destinations: StreamDestinationInput[] = []): boolean {
  return destinations.some((destination) => {
    const url = destination.url.toLowerCase()
    const label = destination.label?.toLowerCase() ?? ''
    return url.includes('twitch.tv') || label.includes('twitch')
  })
}
