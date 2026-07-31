import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { updateLayout } from '@/api/sessions'
import { getGraphics, updateGraphicsBulk } from '@/api/graphics'
import { startRecording, stopRecording } from '@/api/recordings'
import { startStream, stopStream, type StreamDestinationInput } from '@/api/streaming'
import { ApiError } from '@/api/client'
import type { LayoutType } from '@/types/session'
import type { GraphicsState } from '@/types/graphics'
import type { OutputState } from '@/types/studio'

/**
 * Clean backend sync interface.
 * Each function maps 1:1 to compositor REST endpoints.
 * No backend implementation details leak into UI components.
 */
export function useBackendSync(sessionId: string, enabled: boolean) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (!enabled || !sessionId) return null
      setIsSyncing(true)
      setSyncError(null)
      try {
        const result = await fn()
        setLastSyncedAt(new Date().toISOString())
        return result
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Sync failed'
        setSyncError(msg)
        toast.error(msg)
        return null
      } finally {
        setIsSyncing(false)
      }
    },
    [enabled, sessionId],
  )

  const syncLayout = useCallback(
    (layout: LayoutType) => wrap(() => updateLayout(sessionId, layout)),
    [wrap, sessionId],
  )

  const syncGraphics = useCallback(
    (graphics: Partial<GraphicsState>) => wrap(() => updateGraphicsBulk(sessionId, graphics)),
    [wrap, sessionId],
  )

  const fetchGraphics = useCallback(
    () => wrap(() => getGraphics(sessionId)),
    [wrap, sessionId],
  )

  const syncStartRecording = useCallback(
    () => wrap(() => startRecording(sessionId)),
    [wrap, sessionId],
  )

  const syncStopRecording = useCallback(
    () => wrap(() => stopRecording(sessionId)),
    [wrap, sessionId],
  )

  const syncStartStreaming = useCallback(
    (destinationType: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) =>
      wrap(() =>
        destinationType === 'HLS'
          ? startStream(sessionId, { destination_type: 'HLS' })
          : startStream(sessionId, {
              destination_type: 'RTMP',
              destinations: destinations?.filter((d) => d.url.trim()),
            }),
      ),
    [wrap, sessionId],
  )

  const syncStopStreaming = useCallback(
    () => wrap(() => stopStream(sessionId)),
    [wrap, sessionId],
  )

  return {
    isSyncing,
    lastSyncedAt,
    syncError,
    syncLayout,
    syncGraphics,
    fetchGraphics,
    syncStartRecording,
    syncStopRecording,
    syncStartStreaming,
    syncStopStreaming,
  }
}

export function deriveOutputState(
  isActive: boolean,
  isLoading: boolean,
  isStarting: boolean,
  isStopping: boolean,
): OutputState {
  if (isStopping) return 'stopping'
  if (isStarting) return 'starting'
  if (isLoading && !isActive) return 'starting'
  if (isActive) return 'active'
  return 'idle'
}
