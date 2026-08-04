import {
  refreshPlatformConnection,
  importPlatformConnectionFromEmbed,
  getPlatformEmbedCredentials,
  type PlatformEmbedCredentials,
} from '@/api/integrations'
import type { StreamDestinationInput } from '@/api/streaming'
import { isManualRtmpPlatform } from '@/constants/rtmpPlatforms'
import { DestinationPlatform as Platform } from '@/types/destinations'
import type { PersistedDestination, PersistedPlatformConnection } from '@/types/persistence'
import type {
  FacebookLiveRefreshHints,
  YouTubeLiveRefreshHints,
  TwitchChatRegisterHints,
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

export function shouldRefreshYouTubeStreamOnGoLive(
  connection: PersistedPlatformConnection,
): boolean {
  const source = connection.metadata?.source
  return (
    connection.platform === Platform.YOUTUBE &&
    STREAMABLE_CONNECTION_STATUSES.has(connection.status) &&
    typeof source === 'string' &&
    CMS_EMBED_SOURCES.has(source)
  )
}

export function shouldRegisterTwitchChatOnGoLive(
  connection: PersistedPlatformConnection,
): boolean {
  const source = connection.metadata?.source
  return (
    connection.platform === Platform.TWITCH &&
    STREAMABLE_CONNECTION_STATUSES.has(connection.status) &&
    typeof source === 'string' &&
    CMS_EMBED_SOURCES.has(source)
  )
}

function buildFacebookRefreshHints(
  connection: PersistedPlatformConnection,
  credentials: PlatformEmbedCredentials,
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

function buildYouTubeRefreshHints(
  connection: PersistedPlatformConnection,
  credentials: PlatformEmbedCredentials,
): YouTubeLiveRefreshHints {
  const metadata = {
    ...(connection.metadata ?? {}),
    ...(credentials.metadata ?? {}),
  }
  const channelIdRaw = metadata.channel_id
  const channelId =
    typeof channelIdRaw === 'string'
      ? channelIdRaw
      : credentials.platform_user_id || connection.platform_user_id

  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    channelId,
    accountName: credentials.name || connection.name,
    platformLogin: credentials.platform_login || connection.platform_login,
    tokenExpiresAt: credentials.token_expires_at,
  }
}

export type FacebookLiveRefreshFn = (
  hints: FacebookLiveRefreshHints,
) => Promise<PlatformConnectionPayload>

export type YouTubeLiveRefreshFn = (
  hints: YouTubeLiveRefreshHints,
) => Promise<PlatformConnectionPayload>

export type TwitchChatRegisterFn = (hints: TwitchChatRegisterHints) => void

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

    return isManualRtmpPlatform(destination.platform)
  })
}

export type GoLiveDestinationKind = 'saved' | 'pending_youtube'

export interface GoLiveDestinationOption {
  id: string
  kind: GoLiveDestinationKind
  label: string
  platform: string
  destination?: PersistedDestination
  connection?: PersistedPlatformConnection
}

/** Connected embed YouTube without a stream key yet (minted on first go-live). */
export function getPendingYouTubeConnections(
  platformConnections: PersistedPlatformConnection[] = [],
): PersistedPlatformConnection[] {
  return platformConnections.filter(
    (connection) =>
      shouldRefreshYouTubeStreamOnGoLive(connection) &&
      !connection.has_stream_key &&
      !connection.destination_id,
  )
}

/** Saved streamable destinations plus connected YouTube awaiting first go-live refresh. */
export function getGoLiveDestinationOptions(
  destinations: PersistedDestination[] = [],
  platformConnections: PersistedPlatformConnection[] = [],
): GoLiveDestinationOption[] {
  const streamable = getStreamableDestinations(destinations, platformConnections)

  const savedOptions: GoLiveDestinationOption[] = streamable.map((destination) => ({
    id: destination.destination_id,
    kind: 'saved',
    label: destination.label.trim() || destination.platform || 'Custom',
    platform: destination.platform || Platform.CUSTOM_RTMP,
    destination,
  }))

  const pendingOptions: GoLiveDestinationOption[] = getPendingYouTubeConnections(
    platformConnections,
  ).map((connection) => ({
    id: `connection:${connection.connection_id}`,
    kind: 'pending_youtube',
    label: connection.name.trim() || 'YouTube',
    platform: Platform.YOUTUBE,
    connection,
  }))

  return [...savedOptions, ...pendingOptions]
}

export function goLiveOptionsToStreamInputs(
  options: GoLiveDestinationOption[],
): StreamDestinationInput[] {
  return options.map((option) => {
    if (option.kind === 'saved' && option.destination) {
      return {
        url: option.destination.url.trim(),
        label: option.label,
      }
    }
    return { url: '', label: option.label }
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
  studioSessionId?: string,
): Promise<void> {
  const facebookConnections = platformConnections.filter(
    (connection) =>
      connection.platform === Platform.FACEBOOK &&
      STREAMABLE_CONNECTION_STATUSES.has(connection.status) &&
      shouldRefreshFacebookStreamKeyOnGoLive(connection),
  )

  for (const connection of facebookConnections) {
    const credentials = await getPlatformEmbedCredentials(tenantId, connection.connection_id)
    const hints = buildFacebookRefreshHints(connection, credentials)
    const payload = await refreshFn({
      ...hints,
      studioSessionId: studioSessionId?.trim() || hints.studioSessionId,
    })
    await importPlatformConnectionFromEmbed(
      tenantId,
      mapEmbedPayloadToImportRequest('facebook', payload),
    )
  }
}

export async function refreshYouTubeStreamKeys(
  tenantId: string,
  platformConnections: PersistedPlatformConnection[] = [],
  refreshFn: YouTubeLiveRefreshFn,
  studioSessionId?: string,
): Promise<void> {
  const youtubeConnections = platformConnections.filter(shouldRefreshYouTubeStreamOnGoLive)

  for (const connection of youtubeConnections) {
    const credentials = await getPlatformEmbedCredentials(tenantId, connection.connection_id)
    const hints = buildYouTubeRefreshHints(connection, credentials)
    const payload = await refreshFn({
      ...hints,
      studioSessionId: studioSessionId?.trim() || hints.studioSessionId,
    })
    await importPlatformConnectionFromEmbed(
      tenantId,
      mapEmbedPayloadToImportRequest('youtube', payload),
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

export function willStreamToYouTube(
  platformConnections: PersistedPlatformConnection[],
  savedDestinations: PersistedDestination[],
  selectedDestinations?: StreamDestinationInput[],
): boolean {
  const youtubeConnections = platformConnections.filter(shouldRefreshYouTubeStreamOnGoLive)
  if (youtubeConnections.length === 0) return false

  if (!selectedDestinations?.length) {
    return true
  }

  const selectedLabels = new Set(
    selectedDestinations.map((item) => item.label?.trim() || 'Custom'),
  )

  if (
    youtubeConnections.some((connection) =>
      selectedLabels.has(connection.name.trim() || 'YouTube'),
    )
  ) {
    return true
  }

  const youtubeDestinations = savedDestinations.filter(
    (destination) => destination.platform === Platform.YOUTUBE,
  )
  return youtubeDestinations.some((destination) =>
    selectedLabels.has(destination.label.trim() || destination.platform || 'Custom'),
  )
}

export function willStreamToTwitch(
  platformConnections: PersistedPlatformConnection[],
  savedDestinations: PersistedDestination[],
  selectedDestinations?: StreamDestinationInput[],
): boolean {
  const twitchConnections = platformConnections.filter(shouldRegisterTwitchChatOnGoLive)
  if (twitchConnections.length === 0) return false

  if (!selectedDestinations?.length) {
    return true
  }

  const selectedLabels = new Set(
    selectedDestinations.map((item) => item.label?.trim() || 'Custom'),
  )

  if (
    twitchConnections.some((connection) =>
      selectedLabels.has(connection.name.trim() || 'Twitch'),
    )
  ) {
    return true
  }

  const twitchDestinations = savedDestinations.filter(
    (destination) => destination.platform === Platform.TWITCH,
  )
  return twitchDestinations.some((destination) =>
    selectedLabels.has(destination.label.trim() || destination.platform || 'Custom'),
  )
}

function buildTwitchRegisterHints(
  connection: PersistedPlatformConnection,
  credentials: PlatformEmbedCredentials,
  studioSessionId?: string,
): TwitchChatRegisterHints {
  const channelLogin =
    credentials.platform_login?.trim() || connection.platform_login?.trim() || connection.name.trim()

  return {
    channelLogin,
    accessToken: credentials.access_token,
    nick: channelLogin,
    broadcasterUserId: credentials.platform_user_id || connection.platform_user_id,
    accountName: credentials.name || connection.name,
    studioSessionId,
  }
}

export async function registerTwitchChatForGoLive(
  tenantId: string,
  platformConnections: PersistedPlatformConnection[],
  savedDestinations: PersistedDestination[],
  registerFn: TwitchChatRegisterFn,
  studioSessionId?: string,
  selectedDestinations?: StreamDestinationInput[],
): Promise<void> {
  if (!willStreamToTwitch(platformConnections, savedDestinations, selectedDestinations)) {
    return
  }

  const twitchConnections = platformConnections.filter(shouldRegisterTwitchChatOnGoLive)
  const selectedLabels = selectedDestinations?.length
    ? new Set(selectedDestinations.map((item) => item.label?.trim() || 'Custom'))
    : null

  const targetConnections = twitchConnections.filter((connection) => {
    if (!selectedLabels) return true
    if (selectedLabels.has(connection.name.trim() || 'Twitch')) return true
    if (!connection.destination_id) return false
    const destination = savedDestinations.find(
      (item) => item.destination_id === connection.destination_id,
    )
    if (!destination) return false
    return selectedLabels.has(destination.label.trim() || destination.platform || 'Custom')
  })

  await Promise.all(
    targetConnections.map(async (connection) => {
      const credentials = await getPlatformEmbedCredentials(tenantId, connection.connection_id)
      registerFn(buildTwitchRegisterHints(connection, credentials, studioSessionId))
    }),
  )
}

export function hasTwitchStreamDestination(destinations: StreamDestinationInput[] = []): boolean {
  return destinations.some((destination) => {
    const url = destination.url.toLowerCase()
    const label = destination.label?.toLowerCase() ?? ''
    return url.includes('twitch.tv') || label.includes('twitch')
  })
}
