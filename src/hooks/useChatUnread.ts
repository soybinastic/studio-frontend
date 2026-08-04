import { useEffect, useRef, useState } from 'react'
import type { ChatSubTab } from '@/components/studio/chat/ChatSubTabs'

interface UseChatUnreadOptions {
  participantMessageCount: number
  socialCommentCount: number
  isChatTabActive: boolean
  chatSubTab: ChatSubTab
}

export function useChatUnread({
  participantMessageCount,
  socialCommentCount,
  isChatTabActive,
  chatSubTab,
}: UseChatUnreadOptions) {
  const [participantUnread, setParticipantUnread] = useState(0)
  const [socialUnread, setSocialUnread] = useState(0)
  const prevParticipantCountRef = useRef(participantMessageCount)
  const prevSocialCountRef = useRef(socialCommentCount)

  useEffect(() => {
    const delta = participantMessageCount - prevParticipantCountRef.current
    if (delta > 0 && !(isChatTabActive && chatSubTab === 'participants')) {
      setParticipantUnread((count) => count + delta)
    }
    prevParticipantCountRef.current = participantMessageCount
  }, [participantMessageCount, isChatTabActive, chatSubTab])

  useEffect(() => {
    const delta = socialCommentCount - prevSocialCountRef.current
    if (delta > 0 && !(isChatTabActive && chatSubTab === 'socials')) {
      setSocialUnread((count) => count + delta)
    }
    prevSocialCountRef.current = socialCommentCount
  }, [socialCommentCount, isChatTabActive, chatSubTab])

  useEffect(() => {
    if (isChatTabActive && chatSubTab === 'participants') {
      setParticipantUnread(0)
    }
  }, [isChatTabActive, chatSubTab, participantMessageCount])

  useEffect(() => {
    if (isChatTabActive && chatSubTab === 'socials') {
      setSocialUnread(0)
    }
  }, [isChatTabActive, chatSubTab, socialCommentCount])

  return {
    participantUnread,
    socialUnread,
    totalUnread: participantUnread + socialUnread,
  }
}
