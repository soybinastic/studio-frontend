import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { setChat } from '@/api/graphics'
import { ApiError } from '@/api/client'
import { socialCommentsToOverlayMessages } from '@/components/studio/chat/socialChatUtils'
import type { ChatGraphic } from '@/types/graphics'
import type { SocialCommentPayload } from '@/types/studio-chat-signal'

const OVERLAY_SYNC_DEBOUNCE_MS = 400

interface UseSocialChatOverlayOptions {
  sessionId: string
  isHost: boolean
  comments: SocialCommentPayload[]
  initialEnabled?: boolean
  activeSceneId?: string | null
  onChatUpdated?: (chat: ChatGraphic) => void
  onPersistChat?: (chat: ChatGraphic) => void
}

export function useSocialChatOverlay({
  sessionId,
  isHost,
  comments,
  initialEnabled = false,
  onChatUpdated,
  onPersistChat,
}: UseSocialChatOverlayOptions) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [syncing, setSyncing] = useState(false)
  const enabledRef = useRef(enabled)
  const debounceRef = useRef<number | null>(null)
  const commentsRef = useRef(comments)

  enabledRef.current = enabled
  commentsRef.current = comments

  useEffect(() => {
    setEnabled(initialEnabled)
  }, [initialEnabled])

  const pushOverlay = useCallback(
    async (nextEnabled: boolean, nextComments: SocialCommentPayload[]) => {
      if (!isHost || !sessionId.trim()) return

      const payload: ChatGraphic = {
        enabled: nextEnabled,
        messages: nextEnabled ? socialCommentsToOverlayMessages(nextComments) : [],
      }

      setSyncing(true)
      try {
        const result = await setChat(sessionId, payload)
        onChatUpdated?.(result.chat ?? payload)
        onPersistChat?.(result.chat ?? payload)
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to update chat overlay'
        toast.error(message)
        throw error
      } finally {
        setSyncing(false)
      }
    },
    [isHost, onChatUpdated, onPersistChat, sessionId],
  )

  const setOverlayEnabled = useCallback(
    async (next: boolean) => {
      if (!isHost) return

      const previous = enabledRef.current
      setEnabled(next)

      try {
        await pushOverlay(next, commentsRef.current)
      } catch {
        setEnabled(previous)
      }
    },
    [isHost, pushOverlay],
  )

  useEffect(() => {
    if (!isHost || !enabledRef.current) return

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      void pushOverlay(true, commentsRef.current)
    }, OVERLAY_SYNC_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [comments, isHost, pushOverlay])

  return {
    enabled,
    syncing,
    setOverlayEnabled,
  }
}
