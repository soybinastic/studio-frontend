import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  ChatMessageDto,
  ChatUserRole,
  StudioChatConnectionState,
} from '@/types/chat-message'
import { CHAT_DEFAULT_HISTORY_LIMIT } from '@/types/chat-message'
import {
  STUDIO_CHAT_SIGNAL_EVENT,
  buildClientSignal,
  isStudioChatServerEnvelope,
  type SocialCommentPayload,
  type StudioChatClientEventType,
  type StudioChatClientPayloadMap,
  type StudioChatServerEnvelope,
} from '@/types/studio-chat-signal'
import { getStudioChatWsUrl } from '@/lib/studioChatEnv'

export interface UseStudioChatOptions {
  sessionId: string
  userId: string
  displayName: string
  role: ChatUserRole
  tenantId?: string
  enabled?: boolean
}

function upsertMessage(messages: ChatMessageDto[], incoming: ChatMessageDto): ChatMessageDto[] {
  const index = messages.findIndex((m) => m.id === incoming.id)
  if (index >= 0) {
    const next = [...messages]
    next[index] = incoming
    return next
  }
  return [...messages, incoming].sort((a, b) => a.createdAt - b.createdAt)
}

function removeMessage(messages: ChatMessageDto[], messageId: string): ChatMessageDto[] {
  return messages.filter((m) => m.id !== messageId)
}

function socialCommentKey(comment: SocialCommentPayload): string {
  return `${comment.platform}:${comment.platformMessageId}`
}

export function useStudioChat(options: UseStudioChatOptions) {
  const { sessionId, userId, displayName, role, tenantId, enabled = true } = options
  const [connectionState, setConnectionState] = useState<StudioChatConnectionState>('idle')
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [socialComments, setSocialComments] = useState<SocialCommentPayload[]>([])
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set())
  const [lastError, setLastError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const socialIdsRef = useRef<Set<string>>(new Set())
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const emit = useCallback(
    <T extends StudioChatClientEventType>(
      event: T,
      payload: StudioChatClientPayloadMap[T],
    ) => {
      const socket = socketRef.current
      if (!socket?.connected) return
      socket.emit(
        STUDIO_CHAT_SIGNAL_EVENT,
        buildClientSignal(event, sessionId, payload, { tenantId }),
      )
    },
    [sessionId, tenantId],
  )

  const sendPublicMessage = useCallback(
    (message: string) => {
      emit('chat.send', { message })
    },
    [emit],
  )

  const sendPrivateMessage = useCallback(
    (message: string, recipientId: string) => {
      emit('chat.private.send', { message, recipientId })
    },
    [emit],
  )

  const hideMessage = useCallback(
    (messageId: string) => {
      emit('chat.hide', { messageId })
    },
    [emit],
  )

  const unhideMessage = useCallback(
    (messageId: string) => {
      emit('chat.unhide', { messageId })
    },
    [emit],
  )

  const deleteMessage = useCallback(
    (messageId: string) => {
      emit('chat.delete', { messageId })
    },
    [emit],
  )

  const requestHistory = useCallback(
    (limit = CHAT_DEFAULT_HISTORY_LIMIT) => {
      emit('chat.history.request', { limit })
    },
    [emit],
  )

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      emit('chat.typing', { isTyping })
    },
    [emit],
  )

  useEffect(() => {
    if (!enabled) return

    const wsUrl = getStudioChatWsUrl()
    if (!wsUrl) {
      setConnectionState('error')
      setLastError('Studio chat WebSocket URL is not configured.')
      return
    }

    setConnectionState('connecting')
    setLastError(null)

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    const handleConnect = () => {
      setConnectionState('connected')
      socket.emit(
        STUDIO_CHAT_SIGNAL_EVENT,
        buildClientSignal('session.subscribe', sessionId, {
          sessionId,
          tenantId,
          chat: { userId, role, displayName },
        }, { tenantId }),
      )
      socket.emit(
        STUDIO_CHAT_SIGNAL_EVENT,
        buildClientSignal('chat.history.request', sessionId, {
          limit: CHAT_DEFAULT_HISTORY_LIMIT,
        }, { tenantId }),
      )
    }

    const handleDisconnect = () => {
      setConnectionState('disconnected')
    }

    const handleConnectError = (error: Error) => {
      setConnectionState('error')
      setLastError(error.message)
    }

    const handleSignal = (raw: unknown) => {
      if (!isStudioChatServerEnvelope(raw)) return

      switch (raw.event) {
        case 'chat.history': {
          const payload = (raw as StudioChatServerEnvelope<'chat.history'>).payload
          setMessages(payload.messages)
          break
        }
        case 'chat.message':
        case 'chat.private.message': {
          const payload = (raw as StudioChatServerEnvelope<'chat.message'>).payload
          setMessages((prev) => upsertMessage(prev, payload))
          break
        }
        case 'chat.message.hidden': {
          const payload = (raw as StudioChatServerEnvelope<'chat.message.hidden'>).payload
          setMessages((prev) =>
            role === 'host'
              ? prev.map((m) =>
                  m.id === payload.messageId ? { ...m, status: 'hidden' as const } : m,
                )
              : removeMessage(prev, payload.messageId),
          )
          break
        }
        case 'chat.message.unhidden': {
          const payload = (raw as StudioChatServerEnvelope<'chat.message.unhidden'>).payload
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.messageId ? { ...m, status: 'active' as const } : m,
            ),
          )
          break
        }
        case 'chat.message.deleted': {
          const payload = (raw as StudioChatServerEnvelope<'chat.message.deleted'>).payload
          setMessages((prev) => removeMessage(prev, payload.messageId))
          break
        }
        case 'chat.error': {
          const payload = (raw as StudioChatServerEnvelope<'chat.error'>).payload
          setLastError(payload.message)
          break
        }
        case 'chat.typing': {
          const payload = (raw as StudioChatServerEnvelope<'chat.typing'>).payload
          const { userId: typingUserId, isTyping } = payload
          if (typingUserId === userId) break
          setTypingUserIds((prev) => {
            const next = new Set(prev)
            if (isTyping) next.add(typingUserId)
            else next.delete(typingUserId)
            return next
          })
          const existing = typingTimersRef.current.get(typingUserId)
          if (existing) clearTimeout(existing)
          if (isTyping) {
            typingTimersRef.current.set(
              typingUserId,
              setTimeout(() => {
                setTypingUserIds((prev) => {
                  const next = new Set(prev)
                  next.delete(typingUserId)
                  return next
                })
              }, 3000),
            )
          }
          break
        }
        case 'social.comment': {
          const payload = (raw as StudioChatServerEnvelope<'social.comment'>).payload
          const key = socialCommentKey(payload)
          if (socialIdsRef.current.has(key)) break
          socialIdsRef.current.add(key)
          setSocialComments((prev) => [...prev, payload])
          break
        }
        case 'social.comment.batch': {
          const payload = (raw as StudioChatServerEnvelope<'social.comment.batch'>).payload
          setSocialComments((prev) => {
            const next = [...prev]
            for (const comment of payload.comments) {
              const key = socialCommentKey(comment)
              if (socialIdsRef.current.has(key)) continue
              socialIdsRef.current.add(key)
              next.push(comment)
            }
            return next
          })
          break
        }
        case 'session.error': {
          const payload = (raw as StudioChatServerEnvelope<'session.error'>).payload
          setLastError(payload.message)
          break
        }
        default:
          break
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on(STUDIO_CHAT_SIGNAL_EVENT, handleSignal)

    return () => {
      if (socket.connected) {
        socket.emit(
          STUDIO_CHAT_SIGNAL_EVENT,
          buildClientSignal('session.unsubscribe', sessionId, { sessionId }),
        )
      }
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off(STUDIO_CHAT_SIGNAL_EVENT, handleSignal)
      socket.disconnect()
      socketRef.current = null
      typingTimersRef.current.forEach((timer) => clearTimeout(timer))
      typingTimersRef.current.clear()
    }
  }, [enabled, sessionId, userId, displayName, role, tenantId])

  return {
    connectionState,
    messages,
    socialComments,
    typingUserIds: [...typingUserIds],
    lastError,
    sendPublicMessage,
    sendPrivateMessage,
    hideMessage,
    unhideMessage,
    deleteMessage,
    sendTyping,
    requestHistory,
  }
}
