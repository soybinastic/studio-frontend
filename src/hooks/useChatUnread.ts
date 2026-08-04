import { useEffect, useRef, useState } from 'react'
import type { ChatSubTab } from '@/components/studio/chat/ChatSubTabs'
import type { ChatMessageDto } from '@/types/chat-message'
import type { SocialCommentPayload } from '@/types/studio-chat-signal'

interface UseChatUnreadOptions {
  messages: ChatMessageDto[]
  socialComments: SocialCommentPayload[]
  currentUserId: string
  isChatTabActive: boolean
  chatSubTab: ChatSubTab
}

function countUnreadFromOthers(
  items: ChatMessageDto[],
  delta: number,
  currentUserId: string,
): number {
  if (delta <= 0) return 0
  const recent = items.slice(-delta)
  return recent.filter(
    (item) => item.senderId !== currentUserId && item.status !== 'deleted',
  ).length
}

export function useChatUnread({
  messages,
  socialComments,
  currentUserId,
  isChatTabActive,
  chatSubTab,
}: UseChatUnreadOptions) {
  const [participantUnread, setParticipantUnread] = useState(0)
  const [socialUnread, setSocialUnread] = useState(0)
  const prevMessageCountRef = useRef(0)
  const prevSocialCountRef = useRef(0)
  const participantHistorySeededRef = useRef(false)
  const socialHistorySeededRef = useRef(false)

  useEffect(() => {
    if (!participantHistorySeededRef.current) {
      if (messages.length === 0) return

      const isBulkHistory = messages.length > 1
      const isViewingParticipants = isChatTabActive && chatSubTab === 'participants'

      if (isBulkHistory || isViewingParticipants) {
        prevMessageCountRef.current = messages.length
        participantHistorySeededRef.current = true
        return
      }

      participantHistorySeededRef.current = true
    }

    const delta = messages.length - prevMessageCountRef.current
    prevMessageCountRef.current = messages.length

    if (delta > 0 && !(isChatTabActive && chatSubTab === 'participants')) {
      const unread = countUnreadFromOthers(messages, delta, currentUserId)
      if (unread > 0) {
        setParticipantUnread((count) => count + unread)
      }
    }
  }, [messages, currentUserId, isChatTabActive, chatSubTab])

  useEffect(() => {
    if (!socialHistorySeededRef.current) {
      if (socialComments.length === 0) return

      const isBulkHistory = socialComments.length > 1
      const isViewingSocials = isChatTabActive && chatSubTab === 'socials'

      if (isBulkHistory || isViewingSocials) {
        prevSocialCountRef.current = socialComments.length
        socialHistorySeededRef.current = true
        return
      }

      socialHistorySeededRef.current = true
    }

    const delta = socialComments.length - prevSocialCountRef.current
    prevSocialCountRef.current = socialComments.length

    if (delta > 0 && !(isChatTabActive && chatSubTab === 'socials')) {
      setSocialUnread((count) => count + delta)
    }
  }, [socialComments, isChatTabActive, chatSubTab])

  useEffect(() => {
    if (isChatTabActive && chatSubTab === 'participants') {
      setParticipantUnread(0)
    }
  }, [isChatTabActive, chatSubTab, messages])

  useEffect(() => {
    if (isChatTabActive && chatSubTab === 'socials') {
      setSocialUnread(0)
    }
  }, [isChatTabActive, chatSubTab, socialComments])

  return {
    participantUnread,
    socialUnread,
    totalUnread: participantUnread + socialUnread,
  }
}
