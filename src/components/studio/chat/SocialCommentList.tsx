import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SocialDestinationSummary } from '@/api/studioChat'
import type { StudioChatConnectionState } from '@/types/chat-message'
import type { SessionErrorPayload, SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'
import { SocialCommentItem } from '@/components/studio/chat/SocialCommentItem'
import {
  PLATFORM_LABELS,
  type SocialPlatformFilter,
  filterSocialComments,
  formatPlatformList,
  getSocialPlatformsInComments,
  isHostOutboundComment,
  shouldGroupSocialComments,
  sortSocialComments,
} from '@/components/studio/chat/socialChatUtils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SocialCommentListProps {
  comments: SocialCommentPayload[]
  connectionState: StudioChatConnectionState
  activeDestinations?: SocialDestinationSummary[]
  subscribedPlatforms?: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
  className?: string
}

const SCROLL_NEAR_BOTTOM_PX = 80

function SocialCommentsStatus({
  connectionState,
  activeDestinations,
  subscribedPlatforms,
  sessionError,
  hasComments,
}: {
  connectionState: StudioChatConnectionState
  activeDestinations: SocialDestinationSummary[]
  subscribedPlatforms: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
  hasComments: boolean
}) {
  if (sessionError) {
    const platformLabel = sessionError.platform
      ? PLATFORM_LABELS[sessionError.platform]
      : 'Social chat'
    return (
      <div className="mb-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
        <div>
          <p className="font-medium">{platformLabel} error</p>
          <p className="mt-0.5 text-[11px] opacity-90">{sessionError.message}</p>
        </div>
      </div>
    )
  }

  if (hasComments || connectionState !== 'connected') {
    return null
  }

  const activePlatforms = activeDestinations.map((destination) => destination.platform)
  const listeningPlatforms =
    activePlatforms.length > 0
      ? (activePlatforms as SocialPlatform[])
      : subscribedPlatforms

  if (listeningPlatforms.length === 0) {
    return (
      <p className="mb-2 text-[11px] text-muted-foreground">
        Connected to social comment feed.
      </p>
    )
  }

  return (
    <p className="mb-2 text-[11px] text-muted-foreground">
      Listening for live comments from {formatPlatformList(listeningPlatforms)}.
    </p>
  )
}

function PlatformFilterBar({
  platforms,
  value,
  onChange,
}: {
  platforms: SocialPlatform[]
  value: SocialPlatformFilter
  onChange: (next: SocialPlatformFilter) => void
}) {
  if (platforms.length <= 1) {
    return null
  }

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      <Button
        type="button"
        size="sm"
        variant={value === 'all' ? 'secondary' : 'ghost'}
        className="h-6 rounded-full px-2.5 text-[10px]"
        onClick={() => onChange('all')}
      >
        All
      </Button>
      {platforms.map((platform) => (
        <Button
          key={platform}
          type="button"
          size="sm"
          variant={value === platform ? 'secondary' : 'ghost'}
          className="h-6 rounded-full px-2.5 text-[10px]"
          onClick={() => onChange(platform)}
        >
          {PLATFORM_LABELS[platform]}
        </Button>
      ))}
    </div>
  )
}

export function SocialCommentList({
  comments,
  connectionState,
  activeDestinations = [],
  subscribedPlatforms = [],
  sessionError,
  className,
}: SocialCommentListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const prevLengthRef = useRef(comments.length)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<SocialPlatformFilter>('all')

  const sortedComments = useMemo(() => sortSocialComments(comments), [comments])
  const visibleComments = useMemo(
    () => filterSocialComments(sortedComments, platformFilter),
    [sortedComments, platformFilter],
  )
  const availablePlatforms = useMemo(() => {
    const fromComments = getSocialPlatformsInComments(sortedComments)
    for (const destination of activeDestinations) {
      if (destination.platform === 'youtube' || destination.platform === 'twitch') {
        if (!fromComments.includes(destination.platform)) {
          fromComments.push(destination.platform)
        }
      }
    }
    return fromComments
  }, [activeDestinations, sortedComments])

  useEffect(() => {
    if (platformFilter === 'all') return
    if (!availablePlatforms.includes(platformFilter)) {
      setPlatformFilter('all')
    }
  }, [availablePlatforms, platformFilter])

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

    if (!grew) return

    const lastComment = sortedComments.at(-1)
    const isHostMessage = lastComment ? isHostOutboundComment(lastComment) : false

    if (isNearBottomRef.current || isHostMessage || prevLength === 0) {
      scrollToBottom(prevLength === 0 ? 'auto' : 'smooth')
    } else {
      setShowJumpButton(true)
    }
  }, [comments.length, scrollToBottom, sortedComments])

  const statusBar = (
    <SocialCommentsStatus
      connectionState={connectionState}
      activeDestinations={activeDestinations}
      subscribedPlatforms={subscribedPlatforms}
      sessionError={sessionError}
      hasComments={comments.length > 0}
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
              {activeDestinations.length > 0
                ? `Waiting for live chat from ${formatPlatformList(activeDestinations.map((item) => item.platform as SocialPlatform))}.`
                : 'Live comments from connected platforms appear here when you go live.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      {statusBar}
      <PlatformFilterBar
        platforms={availablePlatforms}
        value={platformFilter}
        onChange={setPlatformFilter}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1 py-2 pb-3"
        role="log"
        aria-label="Social comments"
      >
        {visibleComments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground">
              No {platformFilter === 'all' ? '' : `${PLATFORM_LABELS[platformFilter]} `}
              comments yet.
            </p>
          </div>
        ) : (
          visibleComments.map((comment, index) => {
            const originalIndex = sortedComments.indexOf(comment)
            const previous = index > 0 ? visibleComments[index - 1] : undefined
            const previousIndex =
              previous != null ? sortedComments.indexOf(previous) : originalIndex
            const showHeader = !shouldGroupSocialComments(
              previous,
              comment,
              previousIndex,
              originalIndex,
            )

            return (
              <SocialCommentItem
                key={`${comment.platform}:${comment.platformMessageId}`}
                comment={comment}
                showHeader={showHeader}
              />
            )
          })
        )}
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
