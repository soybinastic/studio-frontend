import { useEffect, useRef } from 'react'
import type { ChatMessageDto } from '@/types/chat-message'
import { ChatMessageItem } from '@/components/studio/chat/ChatMessageItem'
import { cn } from '@/lib/utils'

interface ChatMessageListProps {
  messages: ChatMessageDto[]
  currentUserId: string
  isHost: boolean
  resolveDisplayName: (userId: string) => string
  onHide?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReplyPrivate?: (userId: string) => void
  className?: string
}

export function ChatMessageList({
  messages,
  currentUserId,
  isHost,
  resolveDisplayName,
  onHide,
  onDelete,
  onReplyPrivate,
  className,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className={cn('flex flex-1 items-center justify-center p-4 text-center', className)}>
        <p className="text-xs text-muted-foreground">No messages yet. Say hello!</p>
      </div>
    )
  }

  const visibleMessages = messages.filter((m) => {
    if (m.status === 'deleted') return false
    if (m.visibility === 'private') {
      return m.senderId === currentUserId || m.recipientId === currentUserId
    }
    if (m.status === 'hidden' && !isHost) return false
    return true
  })

  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1', className)}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {visibleMessages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          isHost={isHost}
          senderName={resolveDisplayName(message.senderId)}
          onHide={onHide}
          onDelete={onDelete}
          onReplyPrivate={onReplyPrivate}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
