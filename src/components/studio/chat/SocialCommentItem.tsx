import type { SocialCommentPayload } from '@/types/studio-chat-signal'
import {
  PLATFORM_BUBBLE_ACCENT,
  PLATFORM_CHIP_COLORS,
  PLATFORM_LABELS,
  formatSocialSenderLine,
  formatSocialSenderName,
  getSocialCommentInitials,
  isHostOutboundComment,
} from '@/components/studio/chat/socialChatUtils'
import { cn } from '@/lib/utils'

interface SocialCommentItemProps {
  comment: SocialCommentPayload
  showHeader?: boolean
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SocialCommentItem({ comment, showHeader = true }: SocialCommentItemProps) {
  const isOwn = isHostOutboundComment(comment)

  const bubble = (
    <div
      className={cn(
        'relative w-fit max-w-[92%] rounded-2xl border-l-[3px] px-3 py-2 text-xs leading-relaxed',
        isOwn
          ? 'rounded-br-md border-l-primary bg-primary text-primary-foreground'
          : cn('rounded-bl-md bg-muted/80 text-foreground', PLATFORM_BUBBLE_ACCENT[comment.platform]),
      )}
    >
      {showHeader && (
        <div className="mb-1 flex flex-wrap items-center gap-1">
          {!isOwn && (
            <span
              className={cn(
                'rounded px-1 py-0.5 text-[9px] font-medium',
                PLATFORM_CHIP_COLORS[comment.platform],
              )}
            >
              {PLATFORM_LABELS[comment.platform]}
            </span>
          )}
          <span className={cn('text-[10px] font-semibold', isOwn && 'text-primary-foreground/90')}>
            {formatSocialSenderName(comment)}
          </span>
          {isOwn && (
            <span className="text-[9px] opacity-80">{PLATFORM_LABELS[comment.platform]}</span>
          )}
        </div>
      )}
      <p className="whitespace-pre-wrap break-words">{comment.message}</p>
      {showHeader && (
        <span
          className={cn(
            'mt-1 block text-[9px]',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
          title={formatSocialSenderLine(comment)}
        >
          {formatTime(comment.createdAt)}
        </span>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        'group mb-1.5 flex w-full gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        !showHeader && !isOwn && 'pl-9',
      )}
    >
      {!isOwn && (
        <div className="w-7 shrink-0">
          {showHeader ? (
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium',
                PLATFORM_CHIP_COLORS[comment.platform],
              )}
              aria-hidden
            >
              {getSocialCommentInitials(comment)}
            </div>
          ) : null}
        </div>
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col', isOwn ? 'items-end' : 'items-start')}>
        {bubble}
      </div>
    </div>
  )
}
