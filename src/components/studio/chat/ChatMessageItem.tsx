import { EyeOff, MessageSquareReply, Trash2 } from 'lucide-react'
import type { ChatMessageDto } from '@/types/chat-message'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatMessageItemProps {
  message: ChatMessageDto
  isOwn: boolean
  isHost: boolean
  senderName: string
  onHide?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  onReplyPrivate?: (userId: string) => void
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatMessageItem({
  message,
  isOwn,
  isHost,
  senderName,
  onHide,
  onDelete,
  onReplyPrivate,
}: ChatMessageItemProps) {
  const isPrivate = message.visibility === 'private'
  const isHidden = message.status === 'hidden'

  return (
    <div
      className={cn(
        'group rounded-lg border px-2.5 py-2 text-sm',
        isOwn ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background/50',
        isHidden && isHost && 'border-amber-500/40 bg-amber-500/5',
        isPrivate && 'border-violet-500/30',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{isOwn ? 'You' : senderName}</span>
          {isPrivate && (
            <span className="shrink-0 rounded bg-violet-500/15 px-1 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-300">
              Private
            </span>
          )}
          {isHidden && isHost && (
            <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              Hidden
            </span>
          )}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message.message}</p>
      {message.moderationWarning && (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">{message.moderationWarning}</p>
      )}
      {(isHost || (!isOwn && onReplyPrivate)) && (
        <div className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isOwn && onReplyPrivate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => onReplyPrivate(message.senderId)}
            >
              <MessageSquareReply className="mr-1 h-3 w-3" />
              Reply
            </Button>
          )}
          {isHost && message.status === 'active' && onHide && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => onHide(message.id)}
            >
              <EyeOff className="mr-1 h-3 w-3" />
              Hide
            </Button>
          )}
          {isHost && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-destructive hover:text-destructive"
              onClick={() => onDelete(message.id)}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
