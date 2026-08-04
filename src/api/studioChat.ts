import { ApiError } from '@/api/client'
import { getStudioChatHttpUrl } from '@/lib/studioChatEnv'

export type SocialOutboundPlatform = 'youtube' | 'twitch'
export type SocialSendTarget = SocialOutboundPlatform | 'all'

export interface SocialDestinationSummary {
  platform: SocialOutboundPlatform
  accountName?: string
  channelId?: string
  liveChatId?: string
  channelLogin?: string
}

export interface SocialSendResult {
  platform: SocialOutboundPlatform
  success: boolean
  error?: string
}

export interface SocialSendResponse {
  success: boolean
  results: SocialSendResult[]
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; error?: string }
    if (Array.isArray(data.message)) {
      return data.message.join(', ')
    }
    return data.message ?? data.error ?? response.statusText
  } catch {
    return response.statusText
  }
}

async function studioChatRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getStudioChatHttpUrl()
  if (!baseUrl) {
    throw new ApiError(0, 'Studio chat API URL is not configured')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response))
  }

  return response.json() as Promise<T>
}

export async function listSocialDestinations(
  sessionId: string,
): Promise<SocialDestinationSummary[]> {
  const response = await studioChatRequest<{ success: boolean; data?: SocialDestinationSummary[] }>(
    `/sessions/${encodeURIComponent(sessionId)}/social/destinations`,
  )
  return response.data ?? []
}

export async function sendSocialMessage(
  sessionId: string,
  platform: SocialSendTarget,
  message: string,
): Promise<SocialSendResponse> {
  return studioChatRequest<SocialSendResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/social/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ platform, message }),
    },
  )
}
