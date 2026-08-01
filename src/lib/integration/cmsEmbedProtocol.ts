export type EmbedPlatform = 'twitch' | 'youtube' | 'facebook'

export const STUDIO_EMBED_PROTOCOL_PREFIX = 'studio-embed/v1'

export interface EmbedReadyMessage {
  type: 'studio-embed/v1/ready'
  sessionId?: string
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
}

export interface PlatformConnectionPayload {
  name: string
  platform_login: string
  platform_user_id?: string
  rtmp_url: string
  stream_key?: string
  access_token?: string
}

export interface EmbedPlatformConnectedMessage {
  type: 'studio-embed/v1/platform-connected'
  requestId: string
  platform: EmbedPlatform
  payload: PlatformConnectionPayload
}

export interface EmbedPlatformConnectFailedMessage {
  type: 'studio-embed/v1/platform-connect-failed'
  requestId: string
  platform: EmbedPlatform
  error: string
}

export type EmbedOutboundMessage = EmbedReadyMessage | EmbedConnectPlatformMessage
export type EmbedInboundMessage =
  | EmbedConfigMessage
  | EmbedPlatformConnectedMessage
  | EmbedPlatformConnectFailedMessage

export function isEmbedInboundMessage(data: unknown): data is EmbedInboundMessage {
  if (!data || typeof data !== 'object') return false
  const type = (data as { type?: unknown }).type
  return typeof type === 'string' && type.startsWith(STUDIO_EMBED_PROTOCOL_PREFIX)
}

export function createEmbedRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `embed-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
