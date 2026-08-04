import { useCallback, useEffect, useState } from 'react'
import {
  listSocialDestinations,
  sendSocialMessage,
  type SocialDestinationSummary,
  type SocialSendResponse,
  type SocialSendTarget,
} from '@/api/studioChat'

interface UseSocialOutboundOptions {
  sessionId: string
  enabled?: boolean
  active?: boolean
}

export function useSocialOutbound({
  sessionId,
  enabled = true,
  active = true,
}: UseSocialOutboundOptions) {
  const [destinations, setDestinations] = useState<SocialDestinationSummary[]>([])
  const [loadingDestinations, setLoadingDestinations] = useState(false)
  const [sending, setSending] = useState(false)

  const refreshDestinations = useCallback(async () => {
    if (!enabled || !sessionId.trim()) {
      setDestinations([])
      return
    }

    setLoadingDestinations(true)
    try {
      const next = await listSocialDestinations(sessionId)
      setDestinations(next)
    } catch {
      setDestinations([])
    } finally {
      setLoadingDestinations(false)
    }
  }, [enabled, sessionId])

  useEffect(() => {
    if (!active) return
    void refreshDestinations()
  }, [active, refreshDestinations])

  useEffect(() => {
    if (!active || !enabled) return

    const intervalId = window.setInterval(() => {
      void refreshDestinations()
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [active, enabled, refreshDestinations])

  const sendMessage = useCallback(
    async (platform: SocialSendTarget, message: string): Promise<SocialSendResponse> => {
      setSending(true)
      try {
        return await sendSocialMessage(sessionId, platform, message)
      } finally {
        setSending(false)
      }
    },
    [sessionId],
  )

  return {
    destinations,
    loadingDestinations,
    sending,
    refreshDestinations,
    sendMessage,
  }
}
