import { EmbedConnectError } from '@/lib/integration/cmsEmbedProtocol'

export type YouTubeGoLiveErrorVariant = 'live_not_enabled' | 'generic'

const YOUTUBE_STUDIO_URL = 'https://studio.youtube.com'

export { YOUTUBE_STUDIO_URL }

export function isYouTubeLiveNotEnabledFailure(err: unknown): boolean {
  if (err instanceof EmbedConnectError && err.errorCode === 'liveStreamingNotEnabled') {
    return true
  }

  const message = err instanceof Error ? err.message : String(err ?? '')

  if (/liveStreamingNotEnabled|not enabled for live streaming/i.test(message)) {
    return true
  }

  // ApiService mangled gaxios 403 from studio-chat (objects stringified + status codes).
  if (/\b403\b/.test(message) && /\[object Object\]/.test(message)) {
    return true
  }

  return false
}

export function resolveYouTubeGoLiveErrorVariant(err: unknown): YouTubeGoLiveErrorVariant {
  return isYouTubeLiveNotEnabledFailure(err) ? 'live_not_enabled' : 'generic'
}

/** Show in-iframe dialog instead of a toast for embed YouTube go-live refresh failures. */
export function shouldShowYouTubeGoLiveDialog(isEmbedded: boolean): boolean {
  return isEmbedded
}
