import type {
  EmbedPlatform,
  PlatformConnectionPayload,
} from '@/lib/integration/cmsEmbedProtocol'

export interface PlatformConnectionEmbedImportRequest {
  platform: EmbedPlatform
  name: string
  platform_login: string
  platform_user_id?: string
  access_token?: string
  refresh_token?: string
  stream_key?: string
  rtmp_url?: string
  token_expires_at?: string
  metadata?: Record<string, unknown>
}

export function mapEmbedPayloadToImportRequest(
  platform: EmbedPlatform,
  payload: PlatformConnectionPayload,
): PlatformConnectionEmbedImportRequest {
  return {
    platform,
    name: payload.name,
    platform_login: payload.platform_login,
    platform_user_id: payload.platform_user_id,
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    stream_key: payload.stream_key,
    rtmp_url: payload.rtmp_url,
    token_expires_at: payload.token_expires_at,
    metadata: {
      source: 'cms_embed',
      ...(payload.metadata ?? {}),
    },
  }
}
