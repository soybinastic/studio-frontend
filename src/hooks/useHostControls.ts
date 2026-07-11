import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { endSession, getSession, updateLayout } from '@/api/sessions'
import { listRecordings, startRecording, stopRecording } from '@/api/recordings'
import { listStreams, startStream, stopStream } from '@/api/streaming'
import { ApiError } from '@/api/client'
import type { LayoutType, Recording, Stream } from '@/types/session'

export function useHostControls(sessionId: string, enabled: boolean) {
  const [layout, setLayout] = useState<LayoutType>('CONTAIN')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [streams, setStreams] = useState<Stream[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled || !sessionId) return
    try {
      const [session, recs, strs] = await Promise.all([
        getSession(sessionId),
        listRecordings(sessionId),
        listStreams(sessionId),
      ])
      setLayout(session.layout)
      setRecordings(recs)
      setStreams(strs)
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }, [enabled, sessionId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleLayoutChange = async (mode: LayoutType) => {
    setLoading(true)
    try {
      await updateLayout(sessionId, mode)
      setLayout(mode)
      toast.success(`Layout set to ${mode}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update layout')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecording = async () => {
    setLoading(true)
    try {
      await startRecording(sessionId)
      toast.success('Recording started')
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to start recording')
    } finally {
      setLoading(false)
    }
  }

  const handleStopRecording = async () => {
    setLoading(true)
    try {
      await stopRecording(sessionId)
      toast.success('Recording stopped')
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to stop recording')
    } finally {
      setLoading(false)
    }
  }

  const handleStartStream = async (
    destinationType: 'RTMP' | 'HLS',
    destinationUrl?: string,
  ) => {
    setLoading(true)
    try {
      await startStream(sessionId, {
        destination_type: destinationType,
        destination_url: destinationUrl,
      })
      toast.success(`${destinationType} stream started`)
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to start stream')
    } finally {
      setLoading(false)
    }
  }

  const handleStopStream = async () => {
    setLoading(true)
    try {
      await stopStream(sessionId)
      toast.success('Stream stopped')
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to stop stream')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    setLoading(true)
    try {
      await endSession(sessionId)
      toast.success('Session ended')
      return true
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to end session')
      return false
    } finally {
      setLoading(false)
    }
  }

  const activeRecording = recordings.find((r) => r.status === 'RECORDING')
  const activeStream = streams.find((s) => s.status === 'LIVE')

  return {
    layout,
    recordings,
    streams,
    activeRecording,
    activeStream,
    loading,
    handleLayoutChange,
    handleStartRecording,
    handleStopRecording,
    handleStartStream,
    handleStopStream,
    handleEndSession,
    refresh,
  }
}
