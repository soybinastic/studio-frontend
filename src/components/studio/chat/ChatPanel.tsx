import { useMemo, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { ChatSubTabs, type ChatSubTab } from '@/components/studio/chat/ChatSubTabs'
import { ChatConnectionStatus } from '@/components/studio/chat/ChatConnectionStatus'
import { ChatMessageList } from '@/components/studio/chat/ChatMessageList'
import { ChatCompose } from '@/components/studio/chat/ChatCompose'
import { SocialCommentsTab } from '@/components/studio/chat/SocialCommentsTab'
import type { useStudioChat } from '@/hooks/useStudioChat'
import type { ParticipantMedia } from '@/types/session'
import { isStudioChatEnabled } from '@/lib/studioChatEnv'
import { cn } from '@/lib/utils'

type StudioChatStore = ReturnType<typeof useStudioChat>

interface ChatPanelProps {
  isHost: boolean
  currentUserId: string
  hostPeerId: string
  participants: ParticipantMedia[]
  chat: StudioChatStore
  className?: string
}

export function ChatPanel({
  isHost,
  currentUserId,
  hostPeerId,
  participants,
  chat,
  className,
}: ChatPanelProps) {
  const [subTab, setSubTab] = useState<ChatSubTab>('participants')
  const [privateRecipientId, setPrivateRecipientId] = useState<string | null>(null)

  const nameByPeerId = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of participants) {
      map.set(p.peerId, p.displayName)
    }
    return map
  }, [participants])

  const resolveDisplayName = (userId: string) => nameByPeerId.get(userId) ?? userId.slice(0, 8)

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
    if (isHost) {
      setPrivateRecipientId(userId)
      return
    }
    setPrivateRecipientId(hostPeerId)
  }

  const isConnected = chat.connectionState === 'connected'
  const chatEnabled = isStudioChatEnabled()
  const typingLabel =
    chat.typingUserIds.length > 0
      ? `${chat.typingUserIds.map(resolveDisplayName).join(', ')} typing…`
      : null

  return (
    <div className={cn('flex min-h-[20rem] flex-col space-y-3', className)}>
      <div className="rounded-lg border border-border/60 p-3">
        <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Chat
        </Label>
        <ChatSubTabs activeTab={subTab} onTabChange={setSubTab} className="mb-3" />
        <ChatConnectionStatus state={chat.connectionState} error={chat.lastError} className="mb-3" />

        {!chatEnabled ? (
          <p className="text-xs text-muted-foreground">
            Set <code className="text-[10px]">VITE_STUDIO_CHAT_WS_URL</code> to enable session chat.
          </p>
        ) : subTab === 'participants' ? (
          <div className="flex min-h-[16rem] flex-col">
            <ChatMessageList
              messages={participantMessages}
              currentUserId={currentUserId}
              isHost={isHost}
              resolveDisplayName={resolveDisplayName}
              onHide={isHost ? chat.hideMessage : undefined}
              onDelete={isHost ? chat.deleteMessage : undefined}
              onReplyPrivate={handleReplyPrivate}
              className="mb-2 max-h-64 min-h-32"
            />
            {typingLabel && (
              <p className="mb-1 text-[10px] italic text-muted-foreground">{typingLabel}</p>
            )}
            <ChatCompose
              onSend={handleSend}
              onTyping={chat.sendTyping}
              disabled={!isConnected}
              privateRecipientName={privateRecipientName}
              onCancelPrivate={() => setPrivateRecipientId(null)}
            />
          </div>
        ) : (
          <SocialCommentsTab comments={chat.socialComments} />
        )}
      </div>
    </div>
  )
}
