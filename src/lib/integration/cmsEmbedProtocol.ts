export type EmbedPlatform = 'twitch' | 'youtube' | 'facebook'

export type FacebookEmbedTarget = 'profile' | 'page'

export const STUDIO_EMBED_PROTOCOL_PREFIX = 'studio-embed/v1'

export interface EmbedReadyMessage {
  type: 'studio-embed/v1/ready'
  sessionId?: string
  tenantId?: string
}

/** Compositor session id — must match studio-chat WS subscribe room. */
export interface EmbedStudioSessionMessage {
  type: 'studio-embed/v1/studio-session'
  studioSessionId: string
  tenantId?: string
}

export interface EmbedConfigMessage {
  type: 'studio-embed/v1/config'
  delegatePlatforms: EmbedPlatform[]
}

export interface EmbedConnectPlatformMessage {
  type: 'studio-embed/v1/connect-platform'
  requestId: string
  tenantId?: string
  platform: EmbedPlatform
  facebookTarget?: FacebookEmbedTarget
  /** When true, CMS uses full-page redirect (popup was blocked in iframe). */
  youtubeFallbackRedirect?: boolean
}

export interface EmbedYouTubeOAuthCodeMessage {
  type: 'studio-embed/v1/youtube-oauth-code'
  requestId: string
  code: string
  state?: string
}

export interface EmbedCancelPlatformConnectMessage {
  type: 'studio-embed/v1/cancel-platform-connect'
  requestId: string
}

export interface EmbedSelectFacebookPageMessage {
  type: 'studio-embed/v1/select-facebook-page'
  requestId: string
  pageId: string
}

export interface FacebookLiveRefreshHints {
  accessToken: string
  streamingTargetId: string
  accountType?: FacebookEmbedTarget
  facebookUserId?: string
  pageId?: string
  accountName?: string
  platformLogin?: string
  tokenExpiresAt?: string
  /** Compositor session id for studio-chat social registration. */
  studioSessionId?: string
}

export interface YouTubeLiveRefreshHints {
  accessToken: string
  refreshToken?: string
  channelId?: string
  accountName?: string
  platformLogin?: string
  tokenExpiresAt?: string
  title?: string
  description?: string
  /** Compositor session id for studio-chat social registration. */
  studioSessionId?: string
}

export interface EmbedRefreshFacebookLiveMessage {
  type: 'studio-embed/v1/refresh-facebook-live'
  requestId: string
  tenantId?: string
  studioSessionId?: string
  accessToken: string
  streamingTargetId: string
  facebookUserId?: string
  pageId?: string
  accountType?: FacebookEmbedTarget
  accountName?: string
  platformLogin?: string
  tokenExpiresAt?: string
}

export interface EmbedRefreshYouTubeLiveMessage {
  type: 'studio-embed/v1/refresh-youtube-live'
  requestId: string
  tenantId?: string
  studioSessionId?: string
  accessToken: string
  refreshToken?: string
  channelId?: string
  accountName?: string
  platformLogin?: string
  tokenExpiresAt?: string
  title?: string
  description?: string
}

export interface TwitchChatRegisterHints {
  channelLogin: string
  accessToken?: string
  nick?: string
  broadcasterUserId?: string
  accountName?: string
  /** Compositor session id for studio-chat social registration. */
  studioSessionId?: string
}

export interface EmbedRegisterTwitchChatMessage {
  type: 'studio-embed/v1/register-twitch-chat'
  tenantId?: string
  studioSessionId?: string
  channelLogin: string
  accessToken?: string
  nick?: string
  broadcasterUserId?: string
  accountName?: string
}

export interface EmbedFacebookPageOption {
  id: string
  name: string
}

export interface EmbedFacebookPagesMessage {
  type: 'studio-embed/v1/facebook-pages'
  requestId: string
  pages: EmbedFacebookPageOption[]
  accountName?: string
}

export interface EmbedYouTubeOAuthUrlMessage {
  type: 'studio-embed/v1/youtube-oauth-url'
  requestId: string
  authUrl: string
}

export interface PlatformConnectionPayload {
  name: string
  platform_login: string
  platform_user_id?: string
  rtmp_url: string
  stream_key?: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: string
  metadata?: Record<string, unknown>
}

export interface EmbedPlatformConnectedMessage {
  type: 'studio-embed/v1/platform-connected'
  requestId: string
  platform: EmbedPlatform
  payload: PlatformConnectionPayload
}

export type EmbedPlatformConnectErrorCode =
  | 'liveStreamingNotEnabled'
  | 'quotaExceeded'
  | 'invalidCredentials'

export interface EmbedPlatformConnectFailedMessage {
  type: 'studio-embed/v1/platform-connect-failed'
  requestId: string
  platform: EmbedPlatform
  error: string
  errorCode?: EmbedPlatformConnectErrorCode
}

export class EmbedConnectError extends Error {
  errorCode?: EmbedPlatformConnectErrorCode

  constructor(message: string, errorCode?: EmbedPlatformConnectErrorCode) {
    super(message)
    this.name = 'EmbedConnectError'
    this.errorCode = errorCode
  }
}

export function isEmbedErrorHandledByParent(err: unknown): boolean {
  if (err instanceof EmbedConnectError && err.errorCode) {
    return true
  }
  if (err && typeof err === 'object' && 'errorCode' in err) {
    const code = (err as { errorCode?: unknown }).errorCode
    return typeof code === 'string' && code.length > 0
  }
  return false
}

export type EmbedOutboundMessage =
  | EmbedReadyMessage
  | EmbedStudioSessionMessage
  | EmbedConnectPlatformMessage
  | EmbedCancelPlatformConnectMessage
  | EmbedSelectFacebookPageMessage
  | EmbedRefreshFacebookLiveMessage
  | EmbedRefreshYouTubeLiveMessage
  | EmbedRegisterTwitchChatMessage
  | EmbedYouTubeOAuthCodeMessage

export type EmbedInboundMessage =
  | EmbedConfigMessage
  | EmbedFacebookPagesMessage
  | EmbedYouTubeOAuthUrlMessage
  | EmbedPlatformConnectedMessage
  | EmbedPlatformConnectFailedMessage

const INBOUND_MESSAGE_TYPES = new Set<string>([
  'studio-embed/v1/config',
  'studio-embed/v1/facebook-pages',
  'studio-embed/v1/youtube-oauth-url',
  'studio-embed/v1/platform-connected',
  'studio-embed/v1/platform-connect-failed',
])

export function isEmbedInboundMessage(data: unknown): data is EmbedInboundMessage {
  if (!data || typeof data !== 'object') return false
  const type = (data as { type?: unknown }).type
  return typeof type === 'string' && INBOUND_MESSAGE_TYPES.has(type)
}

export function createEmbedRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `embed-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
