export type ChatUserRole = 'host' | 'participant'

export type ChatMessageVisibility = 'public' | 'private'

export type ChatMessageStatus = 'active' | 'hidden' | 'deleted'

export interface ChatMessageDto {
  id: string
  sessionId: string
  senderId: string
  recipientId?: string
  visibility: ChatMessageVisibility
  status: ChatMessageStatus
  message: string
  moderationWarning?: string
  createdAt: number
  updatedAt: number
}

export interface ChatErrorPayload {
  code: string
  message: string
  requestEvent?: string
  messageId?: string
}

export interface ChatSendPayload {
  message: string
}

export interface ChatPrivateSendPayload {
  message: string
  recipientId: string
}

export interface ChatModerationPayload {
  messageId: string
}

export interface ChatHistoryRequestPayload {
  limit?: number
}

export interface ChatTypingPayload {
  isTyping: boolean
}

export interface ChatHistoryPayload {
  messages: ChatMessageDto[]
  limit: number
}

export interface ChatMessageHiddenPayload {
  messageId: string
  hiddenBy: string
  hiddenAt: number
}

export interface ChatMessageUnhiddenPayload {
  messageId: string
}

export interface ChatMessageDeletedPayload {
  messageId: string
  deletedAt: number
}

export interface SessionChatJoinPayload {
  userId: string
  role: ChatUserRole
  displayName?: string
}

export const CHAT_MAX_MESSAGE_LENGTH = 2000
export const CHAT_DEFAULT_HISTORY_LIMIT = 50

export type StudioChatConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
