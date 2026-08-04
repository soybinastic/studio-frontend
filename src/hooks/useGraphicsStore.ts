import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getGraphics } from '@/api/graphics'
import { ApiError } from '@/api/client'
import type { GraphicLayerKey, GraphicsState } from '@/types/graphics'
import { emptyGraphicsState, mergeGraphicsState } from '@/lib/graphics'
import { persistGraphics } from '@/lib/persistenceSync'
import { useBackendSync } from '@/hooks/useBackendSync'

const GRAPHICS_POLL_MS = 2000
const POLL_SKIP_MS = 4000

export function useGraphicsStore(
  sessionId: string,
  isHost: boolean,
  activeSceneId: string | null = null,
) {
  const [graphics, setGraphics] = useState<GraphicsState | null>(null)
  const sync = useBackendSync(sessionId, true)
  const graphicsRef = useRef<GraphicsState | null>(null)
  const skipPollUntilRef = useRef(0)
  graphicsRef.current = graphics

  const refresh = useCallback(async (options?: { force?: boolean }) => {
    if (!sessionId) return
    if (!options?.force && Date.now() < skipPollUntilRef.current) return
    try {
      const state = await getGraphics(sessionId)
      setGraphics(state)
      return state
    } catch (err) {
      if (err instanceof ApiError && isHost) toast.error(err.message)
      return null
    }
  }, [sessionId, isHost])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), GRAPHICS_POLL_MS)
    return () => window.clearInterval(interval)
  }, [refresh])

  const updateLayer = useCallback(
    async (layer: GraphicLayerKey, value: GraphicsState[GraphicLayerKey]) => {
      if (!isHost) return

      const current = graphicsRef.current ?? emptyGraphicsState()
      const next = mergeGraphicsState(current, { [layer]: value })

      skipPollUntilRef.current = Date.now() + POLL_SKIP_MS
      setGraphics(next)

      const result = await sync.syncGraphics({ [layer]: value })
      if (result) {
        setGraphics(result)
        void persistGraphics({ [layer]: value }, sessionId, activeSceneId)
      }
    },
    [isHost, sync, sessionId, activeSceneId],
  )

  const updateLayers = useCallback(
    async (partial: Partial<GraphicsState>) => {
      if (!isHost || Object.keys(partial).length === 0) return

      const current = graphicsRef.current ?? emptyGraphicsState()
      const next = mergeGraphicsState(current, partial)

      skipPollUntilRef.current = Date.now() + POLL_SKIP_MS
      setGraphics(next)

      const result = await sync.syncGraphics(partial)
      if (result) {
        setGraphics(result)
        void persistGraphics(partial, sessionId, activeSceneId)
      }
    },
    [isHost, sync, sessionId, activeSceneId],
  )

  const applyGraphics = useCallback((state: Partial<GraphicsState> | null) => {
    skipPollUntilRef.current = Date.now() + POLL_SKIP_MS
    setGraphics(mergeGraphicsState(emptyGraphicsState(), state ?? {}))
  }, [])

  const patchGraphics = useCallback((partial: Partial<GraphicsState>) => {
    skipPollUntilRef.current = Date.now() + POLL_SKIP_MS
    setGraphics((current) => mergeGraphicsState(current ?? emptyGraphicsState(), partial))
  }, [])

  return {
    graphics,
    updateLayer,
    updateLayers,
    applyGraphics,
    patchGraphics,
    isSyncing: sync.isSyncing,
    refresh,
  }
}
