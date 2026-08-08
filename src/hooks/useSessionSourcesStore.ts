import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { listScenes } from '@/api/scenes'
import {
  attachSourceToScene,
  createSource,
  deleteSource,
  detachSourceFromScene,
  listSources,
  pauseSource,
  playSource,
  reorderSceneSources,
  seekSource,
  setSceneSourceVisibility,
  stopSource,
  updateSource,
} from '@/api/sources'
import {
  getSceneItems,
  type CreateSourceRequest,
  type SceneItem,
  type SceneSourcesConfig,
  type Source,
  type SourcePlaybackRequest,
  type UpdateSourceRequest,
} from '@/types/sources'
import { persistSceneSources } from '@/lib/persistenceSync'
import { enrichSceneSourcesConfig, findMatchingSessionSource } from '@/lib/sourceCatalog'

const DEFAULT_POLL_MS = 5000

interface UseSessionSourcesStoreOptions {
  sessionId: string
  isHost: boolean
  activeSceneId: string | null
  sceneSourcesConfig?: SceneSourcesConfig
  onSceneSourcesUpdated?: (config: SceneSourcesConfig) => void
  /** Set to 0 or null to disable polling. */
  pollMs?: number | null
}

export function useSessionSourcesStore({
  sessionId,
  isHost,
  activeSceneId,
  sceneSourcesConfig,
  onSceneSourcesUpdated,
  pollMs = DEFAULT_POLL_MS,
}: UseSessionSourcesStoreOptions) {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const sourcesRef = useRef(sources)
  sourcesRef.current = sources

  const sceneItems = useMemo(
    () => getSceneItems(sceneSourcesConfig),
    [sceneSourcesConfig],
  )

  const sourceById = useMemo(() => {
    const map = new Map<string, Source>()
    for (const source of sources) map.set(source.id, source)
    return map
  }, [sources])

  const activeSceneItems = useMemo(() => {
    return [...sceneItems].sort((a, b) => a.zIndex - b.zIndex)
  }, [sceneItems])

  const attachedSourceIds = useMemo(
    () => new Set(sceneItems.map((item) => item.sourceId)),
    [sceneItems],
  )

  const applySceneConfig = useCallback(
    (config: SceneSourcesConfig, extraSources: Source[] = []) => {
      const enriched = enrichSceneSourcesConfig(config, sourcesRef.current, extraSources)
      onSceneSourcesUpdated?.(enriched)
      if (sessionId && activeSceneId) {
        void persistSceneSources(sessionId, activeSceneId, enriched)
      }
    },
    [onSceneSourcesUpdated, sessionId, activeSceneId],
  )

  const replaceSources = useCallback((next: Source[]) => {
    setSources(next)
  }, [])

  const loadSources = useCallback(async () => {
    if (!sessionId) return
    try {
      const next = await listSources(sessionId)
      setSources(next)
    } catch (err) {
      if (err instanceof ApiError) {
        // Quiet on poll failures; surface on explicit load via toast only when mutating.
      }
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) {
      setSources([])
      return
    }
    setIsLoading(true)
    void loadSources().finally(() => setIsLoading(false))
  }, [sessionId, loadSources])

  useEffect(() => {
    if (!sessionId || !pollMs || pollMs <= 0) return undefined
    const interval = window.setInterval(() => void loadSources(), pollMs)
    return () => window.clearInterval(interval)
  }, [sessionId, pollMs, loadSources])

  const create = useCallback(
    async (body: CreateSourceRequest) => {
      if (!isHost || !sessionId) return null
      setIsMutating(true)
      try {
        const source = await createSource(sessionId, body)
        setSources((prev) => [...prev, source])
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to create source')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId],
  )

  const update = useCallback(
    async (sourceId: string, body: UpdateSourceRequest) => {
      if (!isHost || !sessionId) return null
      setIsMutating(true)
      try {
        const source = await updateSource(sessionId, sourceId, body)
        setSources((prev) => prev.map((row) => (row.id === sourceId ? source : row)))
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to update source')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId],
  )

  const remove = useCallback(
    async (sourceId: string) => {
      if (!isHost || !sessionId) return false
      setIsMutating(true)
      try {
        await deleteSource(sessionId, sourceId)
        setSources((prev) => prev.filter((row) => row.id !== sourceId))
        // Backend detaches from all scenes — refresh active scene config so tiles drop.
        if (activeSceneId) {
          try {
            const scenes = await listScenes(sessionId)
            const active = scenes.find((scene) => scene.scene_id === activeSceneId)
            if (active) applySceneConfig(active.sources)
          } catch {
            // Best-effort; next poll/refresh will catch up.
          }
        }
        return true
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to remove source')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, applySceneConfig],
  )

  const play = useCallback(
    async (sourceId: string, body?: SourcePlaybackRequest) => {
      if (!isHost || !sessionId) return null
      try {
        const source = await playSource(sessionId, sourceId, body)
        setSources((prev) => prev.map((row) => (row.id === sourceId ? source : row)))
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to play source')
        return null
      }
    },
    [isHost, sessionId],
  )

  const pause = useCallback(
    async (sourceId: string) => {
      if (!isHost || !sessionId) return null
      try {
        const source = await pauseSource(sessionId, sourceId)
        setSources((prev) => prev.map((row) => (row.id === sourceId ? source : row)))
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to pause source')
        return null
      }
    },
    [isHost, sessionId],
  )

  const stop = useCallback(
    async (sourceId: string) => {
      if (!isHost || !sessionId) return null
      try {
        const source = await stopSource(sessionId, sourceId)
        setSources((prev) => prev.map((row) => (row.id === sourceId ? source : row)))
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to stop source')
        return null
      }
    },
    [isHost, sessionId],
  )

  const seek = useCallback(
    async (sourceId: string, positionMs: number) => {
      if (!isHost || !sessionId) return null
      try {
        const source = await seekSource(sessionId, sourceId, positionMs)
        setSources((prev) => prev.map((row) => (row.id === sourceId ? source : row)))
        return source
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to seek source')
        return null
      }
    },
    [isHost, sessionId],
  )

  const attach = useCallback(
    async (sourceId: string, visible = true) => {
      if (!isHost || !sessionId || !activeSceneId) return null
      setIsMutating(true)
      try {
        const config = await attachSourceToScene(sessionId, activeSceneId, {
          source_id: sourceId,
          visible,
        })
        applySceneConfig(config)
        return config
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to attach source')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, applySceneConfig],
  )

  const detach = useCallback(
    async (sourceId: string) => {
      if (!isHost || !sessionId || !activeSceneId) return null
      setIsMutating(true)
      try {
        const config = await detachSourceFromScene(sessionId, activeSceneId, sourceId)
        applySceneConfig(config)
        return config
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to detach source')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, applySceneConfig],
  )

  const setVisibility = useCallback(
    async (sourceId: string, visible: boolean) => {
      if (!isHost || !sessionId || !activeSceneId) return null
      setIsMutating(true)
      try {
        const config = await setSceneSourceVisibility(
          sessionId,
          activeSceneId,
          sourceId,
          visible,
        )
        applySceneConfig(config)
        return config
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to update visibility')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, applySceneConfig],
  )

  const reorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!isHost || !sessionId || !activeSceneId) return null
      const ordered = [...activeSceneItems]
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= ordered.length ||
        toIndex >= ordered.length ||
        fromIndex === toIndex
      ) {
        return null
      }
      const [moved] = ordered.splice(fromIndex, 1)
      ordered.splice(toIndex, 0, moved)
      const sourceIds = ordered.map((item) => item.sourceId)

      setIsMutating(true)
      try {
        const config = await reorderSceneSources(sessionId, activeSceneId, sourceIds)
        applySceneConfig(config)
        return config
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to reorder sources')
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, activeSceneItems, applySceneConfig],
  )

  /** Create a source and attach it to the active scene in one flow. */
  const createAndAttach = useCallback(
    async (body: CreateSourceRequest) => {
      const source = await create(body)
      if (!source) return null
      if (!isHost || !sessionId || !activeSceneId) {
        return { source, config: null as SceneSourcesConfig | null, reused: false as const }
      }
      setIsMutating(true)
      try {
        const config = await attachSourceToScene(sessionId, activeSceneId, {
          source_id: source.id,
          visible: true,
        })
        applySceneConfig(config, [source])
        return { source, config, reused: false as const }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to attach source')
        return { source, config: null as SceneSourcesConfig | null, reused: false as const }
      } finally {
        setIsMutating(false)
      }
    },
    [create, isHost, sessionId, activeSceneId, applySceneConfig],
  )

  /**
   * Attach an existing session Source to the active scene when identity matches,
   * otherwise create + attach. Does not auto-attach to other scenes.
   */
  const createOrAttach = useCallback(
    async (body: CreateSourceRequest) => {
      if (!isHost || !sessionId || !activeSceneId) return null

      const existing = findMatchingSessionSource(
        sourcesRef.current,
        body.type,
        body.settings,
      )
      if (existing) {
        if (attachedSourceIds.has(existing.id)) {
          return {
            source: existing,
            config: null as SceneSourcesConfig | null,
            reused: true as const,
            alreadyAttached: true as const,
          }
        }
        setIsMutating(true)
        try {
          const config = await attachSourceToScene(sessionId, activeSceneId, {
            source_id: existing.id,
            visible: true,
          })
          applySceneConfig(config, [existing])
          return {
            source: existing,
            config,
            reused: true as const,
            alreadyAttached: false as const,
          }
        } catch (err) {
          toast.error(err instanceof ApiError ? err.message : 'Failed to attach source')
          return null
        } finally {
          setIsMutating(false)
        }
      }

      const created = await createAndAttach(body)
      if (!created) return null
      return { ...created, alreadyAttached: false as const }
    },
    [
      isHost,
      sessionId,
      activeSceneId,
      attachedSourceIds,
      applySceneConfig,
      createAndAttach,
    ],
  )

  return {
    sources,
    sourceById,
    sceneItems: activeSceneItems as SceneItem[],
    attachedSourceIds,
    isLoading,
    isMutating,
    loadSources,
    replaceSources,
    create,
    update,
    remove,
    play,
    pause,
    stop,
    seek,
    attach,
    detach,
    setVisibility,
    reorder,
    createAndAttach,
    createOrAttach,
  }
}

export type SessionSourcesStore = ReturnType<typeof useSessionSourcesStore>
