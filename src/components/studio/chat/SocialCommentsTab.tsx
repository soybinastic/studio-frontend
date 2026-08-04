import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import type { StudioChatConnectionState } from '@/types/chat-message'
import type { SessionErrorPayload, SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'
import {
  formatPlatformList,
  formatSocialSenderLine,
} from '@/components/studio/chat/socialChatUtils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SocialCommentsTabProps {
  comments: SocialCommentPayload[]
  connectionState: StudioChatConnectionState
  subscribedPlatforms?: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
  className?: string
}

const PLATFORM_LABELS: Record<SocialCommentPayload['platform'], string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitch: 'Twitch',
}

const PLATFORM_BORDER: Record<SocialCommentPayload['platform'], string> = {
  facebook: 'border-l-blue-500',
  youtube: 'border-l-red-500',
  twitch: 'border-l-purple-500',
}

const PLATFORM_COLORS: Record<SocialCommentPayload['platform'], string> = {
  facebook: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  youtube: 'bg-red-500/15 text-red-700 dark:text-red-300',
  twitch: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
}

const SCROLL_NEAR_BOTTOM_PX = 80

function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function SocialCommentsStatus({
  connectionState,
  subscribedPlatforms,
  sessionError,
}: {
  connectionState: StudioChatConnectionState
  subscribedPlatforms: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
}) {
  if (sessionError) {
    const platformLabel = sessionError.platform
      ? PLATFORM_LABELS[sessionError.platform]
      : 'Social chat'
    return (
      <div className="mb-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">{platformLabel} error</p>
          <p className="mt-0.5 text-[11px] opacity-90">{sessionError.message}</p>
        </div>
      </div>
    )
  }

  if (connectionState !== 'connected') {
    return null
  }

  if (subscribedPlatforms.length === 0) {
    return (
      <p className="mb-2 text-[11px] text-muted-foreground">
        Connected to social comment feed.
      </p>
    )
  }

  return (
    <p className="mb-2 text-[11px] text-muted-foreground">
      Ready for live comments from {formatPlatformList(subscribedPlatforms)}.
    </p>
  )
}

export function SocialCommentsTab({
  comments,
  connectionState,
  subscribedPlatforms = [],
  sessionError,
  className,
}: SocialCommentsTabProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const prevLengthRef = useRef(comments.length)
  const [showJumpButton, setShowJumpButton] = useState(false)

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
  }, [])

  useEffect(() => {
    const prevLength = prevLengthRef.current
    const grew = comments.length > prevLength
    prevLengthRef.current = comments.length

    if (grew && (isNearBottomRef.current || prevLength === 0)) {
      scrollToBottom(prevLength === 0 ? 'auto' : 'smooth')
    } else if (grew) {
      setShowJumpButton(true)
    }
  }, [comments.length, scrollToBottom])

  const statusBar = (
    <SocialCommentsStatus
      connectionState={connectionState}
      subscribedPlatforms={subscribedPlatforms}
      sessionError={sessionError}
    />
  )

  if (comments.length === 0) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
        {statusBar}
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No social comments yet</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Live comments from Facebook, YouTube, or Twitch appear here when the host goes live
              with those platforms connected.
            </p>
            {subscribedPlatforms.length > 0 && connectionState === 'connected' && (
              <p className="text-[11px] text-muted-foreground/80">
                Listening for {formatPlatformList(subscribedPlatforms)}.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      {statusBar}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 py-2"
        role="log"
        aria-label="Social comments"
      >
        {comments.map((comment) => (
          <div
            key={`${comment.platform}:${comment.platformMessageId}`}
            className={cn(
              'rounded-lg border border-border/60 border-l-[3px] bg-background/50 px-2.5 py-2',
              PLATFORM_BORDER[comment.platform],
              comment.source === 'host_outbound' && 'bg-primary/5',
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={cn(
                      'shrink-0 rounded px-1 py-0.5 text-[10px] font-medium',
                      PLATFORM_COLORS[comment.platform],
                    )}
                  >
                    {PLATFORM_LABELS[comment.platform]}
                  </span>
                  <span className="truncate text-xs font-semibold">
                    {formatSocialSenderLine(comment)}
                  </span>
                </div>
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
            New comments
          </Button>
        </div>
      )}
    </div>
  )
}
