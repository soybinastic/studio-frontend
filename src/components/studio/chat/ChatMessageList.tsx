import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import type { ChatMessageDto } from '@/types/chat-message'
import { CHAT_DEFAULT_HISTORY_LIMIT } from '@/types/chat-message'
import { ChatMessageItem } from '@/components/studio/chat/ChatMessageItem'
import {
  isMessageVisible,
  shouldGroupWithPrevious,
} from '@/components/studio/chat/chatUtils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SCROLL_NEAR_BOTTOM_PX = 80

interface ChatMessageListProps {
  messages: ChatMessageDto[]
  currentUserId: string
  isHost: boolean
  hostPeerId: string
  resolveDisplayName: (userId: string) => string
  onHide?: (messageId: string) => void
  onUnhide?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReplyPrivate?: (userId: string) => void
  onLoadMore?: (limit: number) => void
  className?: string
}

export function ChatMessageList({
  messages,
  currentUserId,
  isHost,
  hostPeerId,
  resolveDisplayName,
  onHide,
  onUnhide,
  onDelete,
  onReplyPrivate,
  onLoadMore,
  className,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const prevLengthRef = useRef(messages.length)
  const historyLimitRef = useRef(CHAT_DEFAULT_HISTORY_LIMIT)
  const loadingMoreRef = useRef(false)

  const [showJumpButton, setShowJumpButton] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const visibleMessages = messages.filter((m) =>
    isMessageVisible(m, currentUserId, isHost),
  )

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
    setShowJumpButton(false)
    isNearBottomRef.current = true
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distanceFromBottom <= SCROLL_NEAR_BOTTOM_PX
    isNearBottomRef.current = nearBottom
    setShowJumpButton(!nearBottom)

    if (el.scrollTop <= 16 && onLoadMore && !loadingMoreRef.current && visibleMessages.length >= historyLimitRef.current) {
      loadingMoreRef.current = true
      setLoadingMore(true)
      historyLimitRef.current += CHAT_DEFAULT_HISTORY_LIMIT
      onLoadMore(historyLimitRef.current)
      window.setTimeout(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }, 800)
    }
  }, [onLoadMore, visibleMessages.length])

  useEffect(() => {
    const prevLength = prevLengthRef.current
    const grew = messages.length > prevLength
    prevLengthRef.current = messages.length

    if (!grew) return

    const lastMessage = messages.at(-1)
    const isOwnMessage = lastMessage?.senderId === currentUserId

    if (isNearBottomRef.current || isOwnMessage) {
      scrollToBottom(prevLength === 0 ? 'auto' : 'smooth')
    } else {
      setShowJumpButton(true)
    }
  }, [messages, currentUserId, scrollToBottom])

  if (visibleMessages.length === 0) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center p-6 text-center', className)}>
        <p className="text-sm font-medium text-foreground">Be the first to say hello</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Messages appear here for everyone in the session.
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground/80">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 py-2 pb-3"
        role="log"
        aria-label="Chat messages"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading older messages" />
          </div>
        )}

        {visibleMessages.map((message, index) => {
          const previous = index > 0 ? visibleMessages[index - 1] : undefined
          const showHeader = !shouldGroupWithPrevious(previous, message)

          return (
            <ChatMessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              isHost={isHost}
              isSenderHost={message.senderId === hostPeerId}
              senderName={resolveDisplayName(message.senderId)}
              showHeader={showHeader}
              onHide={onHide}
              onUnhide={onUnhide}
              onDelete={onDelete}
              onReplyPrivate={onReplyPrivate}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {showJumpButton && (
        <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="pointer-events-auto h-7 gap-1 rounded-full px-3 text-xs shadow-md"
            onClick={() => scrollToBottom('smooth')}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            New messages
          </Button>
        </div>
      )}
    </div>
  )
}
