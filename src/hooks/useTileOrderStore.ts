import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { updateScene } from '@/api/scenes'
import { listRtmpSources, type RtmpSource } from '@/api/rtmpSources'
import { getSession, updateSessionTileConfig } from '@/api/sessions'
import { ApiError } from '@/api/client'
import { assignmentsFromOrder, reorderSourceIds, resolveEffectiveAssignments, resolveSourceOrder } from '@/lib/tileOrder'
import { isCompositorPeer } from '@/lib/participants'
import { persistSceneSources, persistTileOrder } from '@/lib/persistenceSync'
import { getVisibleAttachedSourceIds, isCameraSourceAvailable } from '@/lib/sourceCatalog'
import type { SceneSourcesConfig } from '@/types/scenes'
import type { StudioTileSource } from '@/types/participants'
import type { Source } from '@/types/sources'
import type { ConnectionState, ParticipantMedia } from '@/types/session'

const TILE_CONFIG_POLL_MS = 4000
const RTMP_POLL_MS = 5000

const HOST_OWNED_SOURCE_KINDS = new Set(['camera', 'screen', 'prerecorded', 'rtmp'])

interface UseTileOrderStoreOptions {
  sessionId: string
  isHost: boolean
  hostPeerId: string
  participants: ParticipantMedia[]
  connectionState: ConnectionState
  roomId?: string
  activeSceneId: string | null
  sceneSourcesConfig: SceneSourcesConfig | undefined
  /** Session registry Sources (camera / screen / prerecorded / …). */
  sessionSources?: Source[]
  onSceneSourcesUpdated?: (sources: SceneSourcesConfig) => void
}

export function useTileOrderStore({
  sessionId,
  isHost,
  hostPeerId,
  participants,
  connectionState,
  roomId,
  activeSceneId,
  sceneSourcesConfig,
  sessionSources = [],
  onSceneSourcesUpdated,
}: UseTileOrderStoreOptions) {
  const [sessionHostPeerId, setSessionHostPeerId] = useState<string | null>(null)
  const [tileOrderConfig, setTileOrderConfig] = useState<{ version: number; assignments: Record<string, string> }>({
    version: 1,
    assignments: {},
  })
  const [hiddenSourceIds, setHiddenSourceIds] = useState<string[]>([])
  const [rtmpSources, setRtmpSources] = useState<RtmpSource[]>([])
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set())
  const [assignmentOverride, setAssignmentOverride] = useState<Record<string, string> | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const hostRegisteredRef = useRef(false)

  const refreshSessionTileConfig = useCallback(async () => {
    if (!sessionId) return
    try {
      const session = await getSession(sessionId)
      setSessionHostPeerId(session.host_peer_id)
      setTileOrderConfig(session.tile_order_config ?? { version: 1, assignments: {} })
      setHiddenSourceIds(session.hidden_source_ids ?? [])
    } catch (err) {
      if (err instanceof ApiError && isHost) toast.error(err.message)
    }
  }, [sessionId, isHost])

  const refreshRtmpSources = useCallback(async () => {
    if (!sessionId || !isHost) return
    try {
      const sources = await listRtmpSources(sessionId)
      setRtmpSources(sources.filter((source) => source.status === 'ACTIVE'))
    } catch {
      // RTMP list is host-only; ignore for guests.
    }
  }, [sessionId, isHost])

  useEffect(() => {
    void refreshSessionTileConfig()
    const interval = window.setInterval(() => void refreshSessionTileConfig(), TILE_CONFIG_POLL_MS)
    return () => window.clearInterval(interval)
  }, [refreshSessionTileConfig])

  useEffect(() => {
    void refreshRtmpSources()
    if (!isHost) return undefined
    const interval = window.setInterval(() => void refreshRtmpSources(), RTMP_POLL_MS)
    return () => window.clearInterval(interval)
  }, [refreshRtmpSources, isHost])

  useEffect(() => {
    if (!isHost || connectionState !== 'connected' || hostRegisteredRef.current) return
    hostRegisteredRef.current = true
    void updateSessionTileConfig(sessionId, { host_peer_id: hostPeerId })
      .then((session) => {
        setSessionHostPeerId(session.host_peer_id)
      })
      .catch((err) => {
        hostRegisteredRef.current = false
        if (err instanceof ApiError) toast.error(err.message)
      })
  }, [isHost, connectionState, hostPeerId, sessionId])

  const effectiveHostPeerId = sessionHostPeerId ?? hostPeerId
  const hiddenSet = useMemo(() => new Set(hiddenSourceIds), [hiddenSourceIds])

  const sessionSourceById = useMemo(() => {
    const map = new Map<string, Source>()
    for (const source of sessionSources) map.set(source.id, source)
    return map
  }, [sessionSources])

  const hostOwnedSourceIds = useMemo(() => {
    const ids = new Set(rtmpSources.map((source) => source.source_id))
    for (const source of sessionSources) {
      if (HOST_OWNED_SOURCE_KINDS.has(source.type)) {
        ids.add(source.id)
      }
    }
    return ids
  }, [rtmpSources, sessionSources])

  const participantById = useMemo(() => {
    const map = new Map<string, ParticipantMedia>()
    for (const participant of participants) {
      if (participant.sourceId) continue
      if (isCompositorPeer(participant.peerId, { roomId, displayName: participant.displayName })) {
        continue
      }
      map.set(participant.peerId, participant)
    }
    return map
  }, [participants, roomId])

  /** Tracks for Studio Sources (local producers or remote consumers), keyed by sourceId. */
  const sourceMediaById = useMemo(() => {
    const map = new Map<string, ParticipantMedia>()
    for (const participant of participants) {
      if (!participant.sourceId) continue
      map.set(participant.sourceId, participant)
    }
    return map
  }, [participants])

  const attachedSessionSourceIds = useMemo(() => {
    // Only visible SceneItems participate in the preview layout.
    return getVisibleAttachedSourceIds(sceneSourcesConfig)
  }, [sceneSourcesConfig])

  const activeSourceIds = useMemo(() => {
    const ids: string[] = []
    for (const peerId of participantById.keys()) ids.push(peerId)
    for (const source of rtmpSources) ids.push(source.source_id)
    for (const source of sessionSources) {
      if (
        (source.type === 'camera' || source.type === 'screen' || source.type === 'prerecorded') &&
        attachedSessionSourceIds.has(source.id)
      ) {
        if (source.type === 'camera' && !isCameraSourceAvailable(source)) continue
        // Screen stays in layout while on-scene + visible even without a live track
        // (Wave C idle placeholder). Hide uses attachedSessionSourceIds; detach removes it.
        ids.push(source.id)
      }
    }
    return ids
  }, [participantById, rtmpSources, sessionSources, attachedSessionSourceIds, sourceMediaById])

  const effectiveAssignments = useMemo(() => {
    if (assignmentOverride !== null) {
      return Object.keys(assignmentOverride).length > 0 ? assignmentOverride : null
    }
    return resolveEffectiveAssignments(tileOrderConfig, sceneSourcesConfig)
  }, [assignmentOverride, tileOrderConfig, sceneSourcesConfig])

  const orderedSourceIds = useMemo(
    () =>
      resolveSourceOrder(activeSourceIds, {
        hostPeerId: effectiveHostPeerId,
        slotAssignments: effectiveAssignments,
        hiddenSourceIds: hiddenSet,
        hostOwnedSourceIds,
      }),
    [activeSourceIds, effectiveHostPeerId, effectiveAssignments, hiddenSet, hostOwnedSourceIds],
  )

  const buildTile = useCallback(
    (sourceId: string, slotIndex: number, isHidden: boolean): StudioTileSource | null => {
      const participant = participantById.get(sourceId)
      if (participant) {
        return {
          sourceId,
          kind: 'participant',
          displayName: participant.displayName,
          slotIndex,
          isHost: sourceId === effectiveHostPeerId,
          isHidden,
          isPinned: pinnedIds.has(sourceId),
          isSpeaking: false,
          isLocal: participant.isLocal,
          audioEnabled: participant.audioEnabled,
          videoEnabled: participant.videoEnabled,
          connectionStatus: participant.isLocal
            ? (connectionState as StudioTileSource['connectionStatus'])
            : 'connected',
          videoTrack: participant.videoTrack,
          audioTrack: participant.audioTrack,
        }
      }

      const sessionSource = sessionSourceById.get(sourceId)
      if (sessionSource) {
        const kind =
          sessionSource.type === 'camera' ||
          sessionSource.type === 'screen' ||
          sessionSource.type === 'prerecorded'
            ? sessionSource.type
            : 'rtmp'
        const media = sourceMediaById.get(sourceId)
        return {
          sourceId,
          kind,
          displayName: sessionSource.name || sourceId,
          slotIndex,
          isHost: true,
          isHidden,
          isPinned: pinnedIds.has(sourceId),
          isSpeaking: false,
          isLocal: media?.isLocal,
          videoEnabled: Boolean(media?.videoTrack),
          audioEnabled: Boolean(media?.audioTrack),
          videoTrack: media?.videoTrack,
          audioTrack: media?.audioTrack,
        }
      }

      const rtmp = rtmpSources.find((source) => source.source_id === sourceId)
      if (!rtmp) {
        // Orphan id (deleted/detached source still lingering in assignments) — skip tile.
        return null
      }
      return {
        sourceId,
        kind: 'rtmp',
        displayName: rtmp.display_name || sourceId,
        slotIndex,
        isHost: false,
        isHidden,
        isPinned: pinnedIds.has(sourceId),
        isSpeaking: false,
        rtmpUrl: rtmp.url,
      }
    },
    [
      participantById,
      sourceMediaById,
      sessionSourceById,
      rtmpSources,
      effectiveHostPeerId,
      pinnedIds,
      connectionState,
    ],
  )

  const allTileSources = useMemo<StudioTileSource[]>(() => {
    const orderedVisible = orderedSourceIds
      .map((sourceId, slotIndex) => buildTile(sourceId, slotIndex, false))
      .filter((tile): tile is StudioTileSource => tile != null)

    const hiddenTiles: StudioTileSource[] = hiddenSourceIds
      .filter((sourceId) => !orderedSourceIds.includes(sourceId))
      .map((sourceId) => buildTile(sourceId, -1, true))
      .filter((tile): tile is StudioTileSource => tile != null)

    return [...orderedVisible, ...hiddenTiles]
  }, [orderedSourceIds, hiddenSourceIds, buildTile])

  const visibleTileSources = useMemo(
    () => allTileSources.filter((source) => !source.isHidden),
    [allTileSources],
  )

  const persistAssignments = useCallback(
    async (assignments: Record<string, string>) => {
      if (!isHost || !sessionId) return false
      setIsSyncing(true)
      try {
        if (activeSceneId) {
          const updated = await updateScene(sessionId, activeSceneId, {
            sources: { assignments },
          })
          onSceneSourcesUpdated?.(updated.sources)
          void persistSceneSources(
            sessionId,
            activeSceneId,
            updated.sources.assignments ?? assignments,
          )
        } else {
          const session = await updateSessionTileConfig(sessionId, {
            tile_order_config: { assignments },
          })
          setTileOrderConfig(session.tile_order_config)
          void persistTileOrder(session.tile_order_config ?? { version: 1, assignments })
        }
        return true
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to update tile order')
        return false
      } finally {
        setIsSyncing(false)
      }
    },
    [isHost, sessionId, activeSceneId, onSceneSourcesUpdated],
  )

  const reorderSources = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!isHost) return
      const nextOrder = reorderSourceIds(orderedSourceIds, fromIndex, toIndex)
      const assignments = assignmentsFromOrder(nextOrder)
      setAssignmentOverride(assignments)
      const ok = await persistAssignments(assignments)
      setAssignmentOverride(null)
      if (!ok) {
        void refreshSessionTileConfig()
      }
    },
    [isHost, orderedSourceIds, persistAssignments, refreshSessionTileConfig],
  )

  const resetTileOrder = useCallback(async () => {
    if (!isHost) return
    setAssignmentOverride({})
    const ok = await persistAssignments({})
    setAssignmentOverride(null)
    if (!ok) {
      void refreshSessionTileConfig()
    }
  }, [isHost, persistAssignments, refreshSessionTileConfig])

  const toggleHide = useCallback(
    async (sourceId: string) => {
      if (!isHost) return
      const nextHidden = hiddenSourceIds.includes(sourceId)
        ? hiddenSourceIds.filter((id) => id !== sourceId)
        : [...hiddenSourceIds, sourceId]

      setIsSyncing(true)
      try {
        const session = await updateSessionTileConfig(sessionId, {
          hidden_source_ids: nextHidden,
        })
        setHiddenSourceIds(session.hidden_source_ids ?? nextHidden)
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to update hidden sources')
      } finally {
        setIsSyncing(false)
      }
    },
    [isHost, hiddenSourceIds, sessionId],
  )

  const togglePin = useCallback((sourceId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) next.delete(sourceId)
      else next.add(sourceId)
      return next
    })
  }, [])

  const usingSceneOverride = Boolean(
    (assignmentOverride !== null && Object.keys(assignmentOverride).length > 0) ||
      (sceneSourcesConfig?.assignments && Object.keys(sceneSourcesConfig.assignments).length > 0),
  )

  return {
    tileSources: allTileSources,
    visibleTileSources,
    studioParticipants: visibleTileSources.filter((source) => source.kind === 'participant'),
    orderedSourceIds,
    effectiveHostPeerId,
    hiddenSourceIds,
    usingSceneOverride,
    isSyncing,
    reorderSources,
    resetTileOrder,
    toggleHide,
    togglePin,
    refreshRtmpSources,
  }
}
