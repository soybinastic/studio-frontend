import type { SocialDestinationSummary } from '@/api/studioChat'
import type { StudioChatConnectionState } from '@/types/chat-message'
import type { SessionErrorPayload, SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'
import { SocialCommentList } from '@/components/studio/chat/SocialCommentList'
import { SocialChatOverlayToggle } from '@/components/studio/chat/SocialChatOverlayToggle'
import { cn } from '@/lib/utils'

interface SocialCommentsTabProps {
  comments: SocialCommentPayload[]
  connectionState: StudioChatConnectionState
  activeDestinations?: SocialDestinationSummary[]
  subscribedPlatforms?: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
  overlayEnabled?: boolean
  overlaySyncing?: boolean
  onOverlayEnabledChange?: (enabled: boolean) => void
  showOverlayToggle?: boolean
  className?: string
}

export function SocialCommentsTab({
  comments,
  connectionState,
  activeDestinations,
  subscribedPlatforms,
  sessionError,
  overlayEnabled = false,
  overlaySyncing = false,
  onOverlayEnabledChange,
  showOverlayToggle = false,
  className,
}: SocialCommentsTabProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      {showOverlayToggle && onOverlayEnabledChange ? (
        <SocialChatOverlayToggle
          enabled={overlayEnabled}
          syncing={overlaySyncing}
          onEnabledChange={onOverlayEnabledChange}
        />
      ) : null}
      <SocialCommentList
        comments={comments}
        connectionState={connectionState}
        activeDestinations={activeDestinations}
        subscribedPlatforms={subscribedPlatforms}
        sessionError={sessionError}
        className="min-h-0 flex-1"
      />
    </div>
  )
}
