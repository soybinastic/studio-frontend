import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChatSubTabs, type ChatSubTab } from '@/components/studio/chat/ChatSubTabs'
import {
  ChatConnectionStatus,
  ConnectionDot,
} from '@/components/studio/chat/ChatConnectionStatus'
import { ChatMessageList } from '@/components/studio/chat/ChatMessageList'
import { ChatCompose, type ChatComposeHandle } from '@/components/studio/chat/ChatCompose'
import { ChatTypingIndicator } from '@/components/studio/chat/ChatTypingIndicator'
import { SocialCommentsTab } from '@/components/studio/chat/SocialCommentsTab'
import { SocialCompose } from '@/components/studio/chat/SocialCompose'
import type { useStudioChat } from '@/hooks/useStudioChat'
import { useSocialOutbound } from '@/hooks/useSocialOutbound'
import type { ParticipantMedia } from '@/types/session'
import { isStudioChatEnabled } from '@/lib/studioChatEnv'
import { cn } from '@/lib/utils'

type StudioChatStore = ReturnType<typeof useStudioChat>

interface ChatPanelProps {
  sessionId: string
  isHost: boolean
  currentUserId: string
  hostPeerId: string
  participants: ParticipantMedia[]
  chat: StudioChatStore
  subTab: ChatSubTab
  onSubTabChange: (tab: ChatSubTab) => void
  participantUnread?: number
  socialUnread?: number
  className?: string
}

export function ChatPanel({
  sessionId,
  isHost,
  currentUserId,
  hostPeerId,
  participants,
  chat,
  subTab,
  onSubTabChange,
  participantUnread = 0,
  socialUnread = 0,
  className,
}: ChatPanelProps) {
  const [privateRecipientId, setPrivateRecipientId] = useState<string | null>(null)
  const composeRef = useRef<ChatComposeHandle>(null)
  const chatEnabled = isStudioChatEnabled()
  const socialOutbound = useSocialOutbound({
    sessionId,
    enabled: chatEnabled && isHost,
    active: chatEnabled && isHost && subTab === 'socials',
  })

  const handleSocialSend = useCallback(
    async (platform: Parameters<typeof socialOutbound.sendMessage>[0], message: string) => {
      try {
        const response = await socialOutbound.sendMessage(platform, message)
        const failures = response.results.filter((result) => !result.success)
        if (failures.length === 0) {
          toast.success(
            platform === 'all'
              ? 'Message sent to all social platforms'
              : `Message sent to ${platform === 'youtube' ? 'YouTube' : 'Twitch'}`,
          )
          return
        }
        if (response.results.some((result) => result.success)) {
          toast.warning(
            failures.map((result) => `${result.platform}: ${result.error ?? 'failed'}`).join(' · '),
          )
          return
        }
        toast.error(
          failures.map((result) => `${result.platform}: ${result.error ?? 'failed'}`).join(' · '),
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to send social message')
      }
    },
    [socialOutbound],
  )

  const nameByPeerId = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of participants) {
      map.set(p.peerId, p.displayName)
    }
    return map
  }, [participants])

  const resolveDisplayName = (userId: string) => nameByPeerId.get(userId) ?? userId.slice(0, 8)

  const hostDisplayName = resolveDisplayName(hostPeerId)

  const participantMessages = useMemo(
    () => chat.messages.filter((m) => m.visibility === 'public' || m.visibility === 'private'),
    [chat.messages],
  )

  const privateRecipientName = privateRecipientId
    ? resolveDisplayName(privateRecipientId)
    : null

  const handleSend = (message: string) => {
    if (privateRecipientId) {
      chat.sendPrivateMessage(message, privateRecipientId)
      setPrivateRecipientId(null)
      return
    }
    chat.sendPublicMessage(message)
  }

  const handleReplyPrivate = (userId: string) => {
    const recipientId = isHost ? userId : hostPeerId
    setPrivateRecipientId(recipientId)
    composeRef.current?.focus()
  }

  const handleStartPrivate = () => {
    setPrivateRecipientId(hostPeerId)
    composeRef.current?.focus()
  }

  const isConnected = chat.connectionState === 'connected'
  const typingNames = chat.typingUserIds.map(resolveDisplayName)

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="mb-3 flex items-center gap-2">
        <ChatSubTabs
          activeTab={subTab}
          onTabChange={onSubTabChange}
          participantUnread={participantUnread}
          socialUnread={socialUnread}
          className="min-w-0 flex-1"
        />
        {chatEnabled && (
          <span
            className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground"
            title={
              chat.connectionState === 'connected'
                ? 'Connected'
                : chat.connectionState === 'connecting'
                  ? 'Connecting…'
                  : 'Disconnected'
            }
          >
            <ConnectionDot state={chat.connectionState} />
          </span>
        )}
      </div>

      <ChatConnectionStatus state={chat.connectionState} error={chat.lastError} className="mb-3" />

      {!chatEnabled ? (
        <p className="text-xs text-muted-foreground">
          Set <code className="text-[10px]">VITE_STUDIO_CHAT_WS_URL</code> to enable session chat.
        </p>
      ) : subTab === 'participants' ? (
        <div
          className="flex min-h-0 flex-1 flex-col"
          role="tabpanel"
          aria-label="Participant chat"
        >
          <ChatMessageList
            messages={participantMessages}
            currentUserId={currentUserId}
            isHost={isHost}
            hostPeerId={hostPeerId}
            resolveDisplayName={resolveDisplayName}
            onHide={isHost ? chat.hideMessage : undefined}
            onUnhide={isHost ? chat.unhideMessage : undefined}
            onDelete={isHost ? chat.deleteMessage : undefined}
            onReplyPrivate={handleReplyPrivate}
            onLoadMore={chat.requestHistory}
            className="min-h-0 flex-1"
          />

          <ChatTypingIndicator names={typingNames} className="mb-1 shrink-0" />

          <ChatCompose
            ref={composeRef}
            onSend={handleSend}
            onTyping={chat.sendTyping}
            disabled={!isConnected}
            privateRecipientName={privateRecipientName}
            onCancelPrivate={() => setPrivateRecipientId(null)}
            onStartPrivate={!isHost ? handleStartPrivate : undefined}
            showPrivateShortcut={!isHost && !privateRecipientId}
            privateShortcutLabel={`Message ${hostDisplayName} privately`}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col" role="tabpanel" aria-label="Social comments">
          <SocialCommentsTab
            comments={chat.socialComments}
            connectionState={chat.connectionState}
            activeDestinations={socialOutbound.destinations}
            subscribedPlatforms={chat.subscribedPlatforms}
            sessionError={chat.sessionError}
            className="min-h-0 flex-1"
          />
          {isHost ? (
            <SocialCompose
              destinations={socialOutbound.destinations}
              disabled={!isConnected}
              sending={socialOutbound.sending}
              onSend={handleSocialSend}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
