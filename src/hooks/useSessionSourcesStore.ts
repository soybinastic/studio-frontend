import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
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
    (config: SceneSourcesConfig) => {
      onSceneSourcesUpdated?.(config)
      if (sessionId && activeSceneId) {
        void persistSceneSources(sessionId, activeSceneId, config)
      }
    },
    [onSceneSourcesUpdated, sessionId, activeSceneId],
  )

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
        return true
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Failed to remove source')
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId],
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
      const config = await attach(source.id)
      if (!config) {
        // Source exists but attach failed — leave source in registry for retry.
        return { source, config: null }
      }
      return { source, config }
    },
    [create, attach],
  )

  return {
    sources,
    sourceById,
    sceneItems: activeSceneItems as SceneItem[],
    attachedSourceIds,
    isLoading,
    isMutating,
    loadSources,
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
  }
}

export type SessionSourcesStore = ReturnType<typeof useSessionSourcesStore>
