import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Lock,
  MessageSquareReply,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import type { ChatMessageDto } from '@/types/chat-message'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/components/studio/chat/chatUtils'
import { cn } from '@/lib/utils'

interface ChatMessageItemProps {
  message: ChatMessageDto
  isOwn: boolean
  isHost: boolean
  isSenderHost?: boolean
  senderName: string
  showHeader?: boolean
  onHide?: (messageId: string) => void
  onUnhide?: (messageId: string) => void
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
  isSenderHost = false,
  senderName,
  showHeader = true,
  onHide,
  onUnhide,
  onDelete,
  onReplyPrivate,
}: ChatMessageItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isPrivate = message.visibility === 'private'
  const isHidden = message.status === 'hidden'
  const hasModerationActions =
    isHost && (onHide || onUnhide || onDelete) || (!isOwn && onReplyPrivate)

  const bubble = (
    <div
      className={cn(
        'relative max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
        isOwn
          ? 'rounded-br-md bg-primary text-primary-foreground'
          : 'rounded-bl-md bg-muted/80 text-foreground',
        isPrivate && !isOwn && 'ring-1 ring-violet-500/30',
        isPrivate && isOwn && 'bg-violet-600 text-white dark:bg-violet-700',
        isHidden && isHost && 'opacity-60',
      )}
    >
      {showHeader && !isOwn && (
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-semibold">{senderName}</span>
          {isSenderHost && (
            <Badge variant="secondary" className="px-1 py-0 text-[8px]">
              Host
            </Badge>
          )}
          {isPrivate && (
            <span className="inline-flex items-center gap-0.5 text-[9px] opacity-80">
              <Lock className="h-2.5 w-2.5" aria-hidden />
              Private
            </span>
          )}
        </div>
      )}
      {showHeader && isOwn && isPrivate && (
        <div className="mb-1 flex items-center gap-1 text-[9px] opacity-80">
          <Lock className="h-2.5 w-2.5" aria-hidden />
          Private
        </div>
      )}
      <p
        className={cn(
          'whitespace-pre-wrap break-words',
          isHidden && isHost && 'line-through decoration-muted-foreground/50',
        )}
      >
        {message.message}
      </p>
      {message.moderationWarning && (
        <p
          className={cn(
            'mt-1 text-[10px]',
            isOwn ? 'text-primary-foreground/80' : 'text-amber-600 dark:text-amber-400',
          )}
        >
          {message.moderationWarning}
        </p>
      )}
      {isHidden && isHost && showHeader && (
        <p className="mt-1 text-[9px] text-amber-600 dark:text-amber-400">Hidden from participants</p>
      )}
      <span
        className={cn(
          'mt-1 block text-[9px]',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
        )}
      >
        {formatTime(message.createdAt)}
      </span>
    </div>
  )

  return (
    <>
      <div
        className={cn(
          'group flex gap-2',
          isOwn ? 'flex-row-reverse' : 'flex-row',
          !showHeader && (isOwn ? 'mt-0.5' : 'mt-0.5 pl-9'),
        )}
      >
        {!isOwn && (
          <div className="w-7 shrink-0">
            {showHeader ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                {getInitials(senderName)}
              </div>
            ) : null}
          </div>
        )}

        <div className={cn('flex min-w-0 flex-col', isOwn ? 'items-end' : 'items-start')}>
          {bubble}
        </div>

        {hasModerationActions && (
          <div className={cn('flex shrink-0 self-center', isOwn ? 'order-first' : '')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  aria-label="Message actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                {!isOwn && onReplyPrivate && (
                  <DropdownMenuItem onClick={() => onReplyPrivate(message.senderId)}>
                    <MessageSquareReply className="h-3.5 w-3.5" />
                    Reply privately
                  </DropdownMenuItem>
                )}
                {isHost && message.status === 'active' && onHide && (
                  <DropdownMenuItem onClick={() => onHide(message.id)}>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide
                  </DropdownMenuItem>
                )}
                {isHost && message.status === 'hidden' && onUnhide && (
                  <DropdownMenuItem onClick={() => onUnhide(message.id)}>
                    <Eye className="h-3.5 w-3.5" />
                    Unhide
                  </DropdownMenuItem>
                )}
                {isHost && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete message?</DialogTitle>
            <DialogDescription>
              This message will be permanently removed for everyone in the session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete?.(message.id)
                setDeleteOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
