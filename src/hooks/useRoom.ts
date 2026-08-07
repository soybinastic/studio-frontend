import { useCallback, useEffect, useRef, useState } from 'react'
import { RoomClient } from '@/media/RoomClient'
import type { ConnectionState, ParticipantMedia } from '@/types/session'
import type { DeviceSelection } from '@/types/devices'

export interface UseRoomOptions {
  roomId: string
  peerId: string
  displayName: string
  mediasoupWsUrl: string
  enabled?: boolean
  autoPublish?: boolean
}

export function useRoom({
  roomId,
  peerId,
  displayName,
  mediasoupWsUrl,
  enabled = true,
  autoPublish = false,
}: UseRoomOptions) {
  const clientRef = useRef<RoomClient | null>(null)
  const connectionStateRef = useRef<ConnectionState>('idle')
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [participants, setParticipants] = useState<ParticipantMedia[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  const leave = useCallback(() => {
    clientRef.current?.close()
    clientRef.current = null
    setConnectionState('disconnected')
    setIsPublished(false)
  }, [])

  const toggleMic = useCallback(async () => {
    await clientRef.current?.toggleMic()
  }, [])

  const toggleWebcam = useCallback(async () => {
    await clientRef.current?.toggleWebcam()
  }, [])

  const publishProducers = useCallback(async () => {
    if (!clientRef.current) return
    await clientRef.current.publishProducers()
    setIsPublished(true)
  }, [])

  const switchDevices = useCallback(async (selection: DeviceSelection): Promise<DeviceSelection | null> => {
    const client = clientRef.current
    if (!client) return null
    return client.replaceDevices(selection)
  }, [])

  const produceCameraSource = useCallback(
    async (sourceId: string, deviceId: string): Promise<{ producerId: string }> => {
      const client = clientRef.current
      if (!client) throw new Error('Room not connected')
      return client.produceCameraSource(sourceId, deviceId)
    },
    [],
  )

  const stopCameraSource = useCallback(async (sourceId: string): Promise<void> => {
    await clientRef.current?.stopCameraSource(sourceId)
  }, [])

  const produceScreenShare = useCallback(
    async (sourceId: string): Promise<{ producerId: string }> => {
      const client = clientRef.current
      if (!client) throw new Error('Room not connected')
      return client.produceScreenShare(sourceId)
    },
    [],
  )

  const stopScreenShare = useCallback(async (sourceId: string): Promise<void> => {
    await clientRef.current?.stopScreenShare(sourceId)
  }, [])

  useEffect(() => {
    if (!enabled || !roomId || !peerId || !displayName || !mediasoupWsUrl) {
      return
    }

    let cancelled = false
    const client = new RoomClient({
      roomId,
      peerId,
      displayName,
      mediasoupWsUrl,
      autoPublish,
      onStateChange: (state) => {
        if (!cancelled) {
          connectionStateRef.current = state
          setConnectionState(state)
        }
      },
      onParticipantsChange: (next) => {
        if (!cancelled) setParticipants(next)
      },
      onError: (err) => {
        if (!cancelled) setError(err.message)
      },
    })

    clientRef.current = client

    client.join().catch((err: Error) => {
      if (!cancelled) {
        setError(err.message)
        setConnectionState('error')
      }
    })

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const state = connectionStateRef.current
      if (state === 'connected' || state === 'connecting') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      cancelled = true
      window.removeEventListener('beforeunload', onBeforeUnload)
      client.close()
      clientRef.current = null
      setIsPublished(false)
    }
  }, [enabled, roomId, peerId, displayName, mediasoupWsUrl, autoPublish])

  const localParticipant = participants.find((p) => p.isLocal && !p.sourceId)
  const micEnabled = localParticipant?.audioEnabled ?? false
  const webcamEnabled = localParticipant?.videoEnabled ?? false

  return {
    connectionState,
    participants,
    error,
    micEnabled,
    webcamEnabled,
    isPublished,
    toggleMic,
    toggleWebcam,
    publishProducers,
    switchDevices,
    produceCameraSource,
    stopCameraSource,
    produceScreenShare,
    stopScreenShare,
    leave,
  }
}
