import { useCallback, useMemo, useState } from 'react'
import type { ParticipantMedia } from '@/types/session'
import type { StudioParticipant } from '@/types/participants'
import { isCompositorPeer } from '@/lib/participants'

export function useParticipantStore(
  participants: ParticipantMedia[],
  hostPeerId: string,
  connectionState: string,
  roomId?: string,
) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const studioParticipants = useMemo<StudioParticipant[]>(() => {
    const humanParticipants = participants.filter(
      (p) => !isCompositorPeer(p.peerId, { roomId, displayName: p.displayName }),
    )

    const sorted = [...humanParticipants].sort((a, b) => {
      if (a.peerId === hostPeerId) return -1
      if (b.peerId === hostPeerId) return 1
      return 0
    })

    return sorted.map((p, index) => ({
      ...p,
      slotIndex: index,
      isHost: p.peerId === hostPeerId,
      isPinned: pinnedIds.has(p.peerId),
      isHidden: hiddenIds.has(p.peerId),
      isSpeaking: false,
      connectionStatus: p.isLocal ? (connectionState as StudioParticipant['connectionStatus']) : 'connected',
    }))
  }, [participants, hostPeerId, pinnedIds, hiddenIds, connectionState, roomId])

  const togglePin = useCallback((peerId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(peerId)) next.delete(peerId)
      else next.add(peerId)
      return next
    })
  }, [])

  const toggleHide = useCallback((peerId: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(peerId)) next.delete(peerId)
      else next.add(peerId)
      return next
    })
  }, [])

  const visibleParticipants = useMemo(
    () => studioParticipants.filter((p) => !p.isHidden),
    [studioParticipants],
  )

  return {
    studioParticipants,
    visibleParticipants,
    togglePin,
    toggleHide,
  }
}
