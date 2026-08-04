/**
 * Studio Chat WebSocket signal contract.
 * Keep in sync with backends/api/src/common/interfaces/studio-chat-signal.interface.ts
 */

import type {
  ChatErrorPayload,
  ChatHistoryPayload,
  ChatHistoryRequestPayload,
  ChatMessageDeletedPayload,
  ChatMessageDto,
  ChatMessageHiddenPayload,
  ChatMessageUnhiddenPayload,
  ChatModerationPayload,
  ChatPrivateSendPayload,
  ChatSendPayload,
  ChatTypingPayload,
  SessionChatJoinPayload,
} from '@/types/chat-message'

export const STUDIO_CHAT_SIGNAL_VERSION = 1 as const
export const STUDIO_CHAT_SIGNAL_EVENT = 'studio-chat:signal' as const

export type StudioChatSignalVersion = typeof STUDIO_CHAT_SIGNAL_VERSION

export type SocialPlatform = 'facebook' | 'youtube' | 'twitch'

export type SocialCommentSource =
  | 'facebook_webhook'
  | 'facebook_graph_poll'
  | 'youtube_api'
  | 'twitch_irc'
  | 'host_outbound'

export interface SocialCommentPayload {
  platform: SocialPlatform
  platformMessageId: string
  message: string
  from: { id?: string; name: string }
  account: {
    id?: string
    name: string
    accountType?: 'page' | 'profile' | 'channel'
  }
  liveResourceId?: string
  source: SocialCommentSource
  createdAt?: number
}

export interface SocialCommentBatchPayload {
  comments: SocialCommentPayload[]
  reason: 'reconnect_replay' | 'catch_up'
}

export interface SessionSubscribedPayload {
  sessionId: string
  subscribedPlatforms: SocialPlatform[]
}

export interface SessionErrorPayload {
  code: string
  message: string
  platform?: SocialPlatform
  liveResourceId?: string
  retryAfterMs?: number
}

export interface SessionSubscribePayload {
  sessionId: string
  tenantId?: string
  studioUuid?: string
  since?: number
  chat?: SessionChatJoinPayload
}

export interface SessionUnsubscribePayload {
  sessionId: string
}

export type StudioChatServerEventType =
  | 'session.subscribed'
  | 'session.error'
  | 'social.comment'
  | 'social.comment.batch'
  | 'chat.message'
  | 'chat.private.message'
  | 'chat.history'
  | 'chat.message.hidden'
  | 'chat.message.unhidden'
  | 'chat.message.deleted'
  | 'chat.error'
  | 'chat.typing'

export type StudioChatClientEventType =
  | 'session.subscribe'
  | 'session.unsubscribe'
  | 'session.ping'
  | 'chat.join'
  | 'chat.send'
  | 'chat.private.send'
  | 'chat.hide'
  | 'chat.unhide'
  | 'chat.delete'
  | 'chat.history.request'
  | 'chat.typing'

export interface StudioChatServerPayloadMap {
  'session.subscribed': SessionSubscribedPayload
  'session.error': SessionErrorPayload
  'social.comment': SocialCommentPayload
  'social.comment.batch': SocialCommentBatchPayload
  'chat.message': ChatMessageDto
  'chat.private.message': ChatMessageDto
  'chat.history': ChatHistoryPayload
  'chat.message.hidden': ChatMessageHiddenPayload
  'chat.message.unhidden': ChatMessageUnhiddenPayload
  'chat.message.deleted': ChatMessageDeletedPayload
  'chat.error': ChatErrorPayload
  'chat.typing': { userId: string; isTyping: boolean }
}

export interface StudioChatClientPayloadMap {
  'session.subscribe': SessionSubscribePayload
  'session.unsubscribe': SessionUnsubscribePayload
  'session.ping': { sentAt: number }
  'chat.join': SessionChatJoinPayload
  'chat.send': ChatSendPayload
  'chat.private.send': ChatPrivateSendPayload
  'chat.hide': ChatModerationPayload
  'chat.unhide': ChatModerationPayload
  'chat.delete': ChatModerationPayload
  'chat.history.request': ChatHistoryRequestPayload
  'chat.typing': ChatTypingPayload
}

export interface StudioChatServerEnvelope<T extends StudioChatServerEventType = StudioChatServerEventType> {
  v: StudioChatSignalVersion
  event: T
  id: string
  sessionId: string
  sentAt: number
  tenantId?: string
  studioUuid?: string
  payload: StudioChatServerPayloadMap[T]
}

export interface StudioChatClientEnvelope<T extends StudioChatClientEventType = StudioChatClientEventType> {
  v: StudioChatSignalVersion
  event: T
  id: string
  sessionId: string
  sentAt: number
  tenantId?: string
  studioUuid?: string
  payload: StudioChatClientPayloadMap[T]
}

export type StudioChatServerSignal<T extends StudioChatServerEventType = StudioChatServerEventType> =
  StudioChatServerEnvelope<T>

export type StudioChatClientSignal<T extends StudioChatClientEventType = StudioChatClientEventType> =
  StudioChatClientEnvelope<T>

export function isStudioChatServerEnvelope(value: unknown): value is StudioChatServerEnvelope {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.v === STUDIO_CHAT_SIGNAL_VERSION &&
    typeof record.event === 'string' &&
    typeof record.sessionId === 'string' &&
    typeof record.id === 'string' &&
    typeof record.sentAt === 'number' &&
    record.payload !== undefined
  )
}

export function isStudioChatServerSignal(value: unknown): value is StudioChatServerSignal {
  return isStudioChatServerEnvelope(value)
}

export function buildClientSignal<T extends StudioChatClientEventType>(
  event: T,
  sessionId: string,
  payload: StudioChatClientPayloadMap[T],
  options?: { tenantId?: string; studioUuid?: string; id?: string },
): StudioChatClientSignal<T> {
  return {
    v: STUDIO_CHAT_SIGNAL_VERSION,
    event,
    id: options?.id ?? `cli_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    sessionId,
    sentAt: Date.now(),
    tenantId: options?.tenantId,
    studioUuid: options?.studioUuid,
    payload,
  }
}

export function resolveStudioChatWsUrl(httpOrWsUrl: string): string {
  const trimmed = httpOrWsUrl.replace(/\/$/, '')
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed
  }
  return trimmed.replace(/^http/i, 'ws')
}
