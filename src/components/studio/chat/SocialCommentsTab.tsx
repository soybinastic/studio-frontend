import type { SocialCommentPayload } from '@/types/studio-chat-signal'
import { cn } from '@/lib/utils'

interface SocialCommentsTabProps {
  comments: SocialCommentPayload[]
  className?: string
}

const PLATFORM_LABELS: Record<SocialCommentPayload['platform'], string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitch: 'Twitch',
}

const PLATFORM_COLORS: Record<SocialCommentPayload['platform'], string> = {
  facebook: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  youtube: 'bg-red-500/15 text-red-700 dark:text-red-300',
  twitch: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SocialCommentsTab({ comments, className }: SocialCommentsTabProps) {
  if (comments.length === 0) {
    return (
      <div className={cn('flex min-h-32 items-center justify-center p-4 text-center', className)}>
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">No social comments yet</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Live comments from Facebook, YouTube, or Twitch appear here once the host connects
            those platforms and goes live from the CMS.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('flex max-h-80 min-h-32 flex-col gap-2 overflow-y-auto', className)}
      role="log"
      aria-live="polite"
      aria-label="Social comments"
    >
      {comments.map((comment) => (
        <div
          key={`${comment.platform}:${comment.platformMessageId}`}
          className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  'shrink-0 rounded px-1 py-0.5 text-[10px] font-medium',
                  PLATFORM_COLORS[comment.platform],
                )}
              >
                {PLATFORM_LABELS[comment.platform]}
              </span>
              <span className="truncate text-xs font-semibold">{comment.from.name}</span>
            </div>
            {comment.createdAt && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{comment.message}</p>
        </div>
      ))}
    </div>
  )
}
