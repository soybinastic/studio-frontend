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

function socialKey(comment: SocialCommentPayload): string {
  return `${comment.platform}:${comment.platformMessageId}`
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
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const seenSocialIdsRef = useRef<Set<string>>(new Set())
  const seededRef = useRef(false)

  useEffect(() => {
    if (!seededRef.current && messages.length === 0 && socialComments.length === 0) {
      return
    }

    if (!seededRef.current) {
      for (const message of messages) {
        seenMessageIdsRef.current.add(message.id)
      }
      for (const comment of socialComments) {
        seenSocialIdsRef.current.add(socialKey(comment))
      }
      seededRef.current = true
      return
    }

    let newParticipantUnread = 0
    for (const message of messages) {
      if (seenMessageIdsRef.current.has(message.id)) continue
      seenMessageIdsRef.current.add(message.id)
      if (message.senderId === currentUserId) continue
      if (message.status === 'deleted') continue
      if (!(isChatTabActive && chatSubTab === 'participants')) {
        newParticipantUnread += 1
      }
    }
    if (newParticipantUnread > 0) {
      setParticipantUnread((count) => count + newParticipantUnread)
    }
  }, [messages, currentUserId, isChatTabActive, chatSubTab])

  useEffect(() => {
    if (!seededRef.current) return

    let newSocialUnread = 0
    for (const comment of socialComments) {
      const key = socialKey(comment)
      if (seenSocialIdsRef.current.has(key)) continue
      seenSocialIdsRef.current.add(key)
      if (!(isChatTabActive && chatSubTab === 'socials')) {
        newSocialUnread += 1
      }
    }
    if (newSocialUnread > 0) {
      setSocialUnread((count) => count + newSocialUnread)
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
