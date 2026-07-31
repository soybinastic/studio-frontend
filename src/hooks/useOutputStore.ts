import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSession } from '@/api/sessions'
import { listRecordings } from '@/api/recordings'
import { listStreams } from '@/api/streaming'
import { ApiError } from '@/api/client'
import type { CountdownState, LayoutType, Recording, Stream } from '@/types/session'
import type { GraphicsState } from '@/types/graphics'
import type { OutputState } from '@/types/studio'
import { deriveOutputState } from '@/hooks/useBackendSync'

const SESSION_POLL_MS = 3000
const COUNTDOWN_POLL_MS = 1000

interface UseOutputStoreOptions {
  sessionId: string
  isHost: boolean
  initialLayout?: LayoutType
}

export function useOutputStore({
  sessionId,
  isHost,
  initialLayout = 'CONTAIN',
}: UseOutputStoreOptions) {
  const [layout, setLayout] = useState<LayoutType>(initialLayout)
  const [countdownState, setCountdownState] = useState<CountdownState | null>(null)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [graphics, setGraphics] = useState<GraphicsState | null>(null)
  const [recordingAction, setRecordingAction] = useState<'starting' | 'stopping' | null>(null)
  const [streamingAction, setStreamingAction] = useState<'starting' | 'stopping' | null>(null)
  const countdownStateRef = useRef(countdownState)
  countdownStateRef.current = countdownState

  const refreshSession = useCallback(async () => {
    if (!sessionId) return
    try {
      const session = await getSession(sessionId)
      setLayout(session.layout)
      setCountdownState(session.countdown_state)
    } catch (err) {
      if (err instanceof ApiError && isHost) toast.error(err.message)
    }
  }, [sessionId, isHost])

  const refreshHostOutput = useCallback(async () => {
    if (!isHost || !sessionId) return
    try {
      const [recs, strs] = await Promise.all([
        listRecordings(sessionId),
        listStreams(sessionId),
      ])
      setRecordings(recs)
      setStreams(strs)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }, [isHost, sessionId])

  const refresh = useCallback(async () => {
    await Promise.all([refreshSession(), refreshHostOutput()])
  }, [refreshSession, refreshHostOutput])

  // Layout + countdown sync — all participants poll
  useEffect(() => {
    void refreshSession()
    const pollMs = countdownStateRef.current?.active ? COUNTDOWN_POLL_MS : SESSION_POLL_MS
    const interval = window.setInterval(() => void refreshSession(), pollMs)
    return () => window.clearInterval(interval)
  }, [refreshSession, countdownState?.active])

  // Recording/stream state — host only
  useEffect(() => {
    if (!isHost) return
    void refreshHostOutput()
  }, [isHost, refreshHostOutput])

  const activeRecording = recordings.find((r) => r.status === 'RECORDING')
  const activeStream = streams.find((s) => s.status === 'LIVE')

  const recordingState: OutputState = deriveOutputState(
    Boolean(activeRecording),
    false,
    recordingAction === 'starting',
    recordingAction === 'stopping',
  )

  const streamingState: OutputState = deriveOutputState(
    Boolean(activeStream),
    false,
    streamingAction === 'starting',
    streamingAction === 'stopping',
  )

  return {
    layout,
    setLayout,
    countdownState,
    setCountdownState,
    graphics,
    setGraphics,
    activeRecording,
    activeStream,
    recordingState,
    streamingState,
    setRecordingAction,
    setStreamingAction,
    refresh,
    refreshSession,
  }
}
