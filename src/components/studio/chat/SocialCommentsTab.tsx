import type { SocialDestinationSummary } from '@/api/studioChat'
import type { StudioChatConnectionState } from '@/types/chat-message'
import type { SessionErrorPayload, SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'
import { SocialCommentList } from '@/components/studio/chat/SocialCommentList'
import { cn } from '@/lib/utils'

interface SocialCommentsTabProps {
  comments: SocialCommentPayload[]
  connectionState: StudioChatConnectionState
  activeDestinations?: SocialDestinationSummary[]
  subscribedPlatforms?: SocialPlatform[]
  sessionError?: SessionErrorPayload | null
  className?: string
}

export function SocialCommentsTab({
  comments,
  connectionState,
  activeDestinations,
  subscribedPlatforms,
  sessionError,
  className,
}: SocialCommentsTabProps) {
  return (
    <SocialCommentList
      comments={comments}
      connectionState={connectionState}
      activeDestinations={activeDestinations}
      subscribedPlatforms={subscribedPlatforms}
      sessionError={sessionError}
      className={cn(className)}
    />
  )
}
