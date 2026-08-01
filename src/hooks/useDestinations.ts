import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type {
  ConnectedDestination,
  CustomRTMPFormValues,
  DestinationPlatform,
  FacebookTarget,
} from '@/types/destinations'
import { DestinationPlatform as Platform, DestinationStatus as Status } from '@/types/destinations'

const MOCK_DESTINATIONS: ConnectedDestination[] = []

export function useDestinations(initialDestinations: ConnectedDestination[] = MOCK_DESTINATIONS) {
  const [destinations, setDestinations] = useState<ConnectedDestination[]>(initialDestinations)
  const [isConnecting, setIsConnecting] = useState(false)

  const simulateOAuthConnect = useCallback(
    async (
      platform: Exclude<DestinationPlatform, typeof Platform.CUSTOM_RTMP>,
      name: string,
      facebookTarget?: FacebookTarget,
    ) => {
      setIsConnecting(true)
      const tempId = crypto.randomUUID()

      setDestinations((prev) => [
        ...prev,
        {
          id: tempId,
          platform,
          name,
          status: Status.CONNECTING,
          facebookTarget,
          createdAt: new Date().toISOString(),
        },
      ])

      await new Promise((resolve) => setTimeout(resolve, 1200))

      setDestinations((prev) =>
        prev.map((d) =>
          d.id === tempId
            ? { ...d, status: Status.CONNECTED, name }
            : d,
        ),
      )
      setIsConnecting(false)
      toast.success(`${name} connected successfully`)
    },
    [],
  )

  const connectYouTube = useCallback(async () => {
    await simulateOAuthConnect(Platform.YOUTUBE, 'My Gaming Channel')
  }, [simulateOAuthConnect])

  const connectFacebook = useCallback(
    async (target: FacebookTarget) => {
      const name = target === 'profile' ? 'John Doe (Profile)' : 'My Brand Page'
      await simulateOAuthConnect(Platform.FACEBOOK, name, target)
    },
    [simulateOAuthConnect],
  )

  const connectTwitch = useCallback(async () => {
    await simulateOAuthConnect(Platform.TWITCH, 'streamer_pro')
  }, [simulateOAuthConnect])

  const connectCustomRTMP = useCallback(async (values: CustomRTMPFormValues) => {
    setIsConnecting(true)
    const tempId = crypto.randomUUID()

    setDestinations((prev) => [
      ...prev,
      {
        id: tempId,
        platform: Platform.CUSTOM_RTMP,
        name: values.displayName,
        status: Status.CONNECTING,
        rtmpUrl: values.rtmpUrl,
        streamKey: values.streamKey,
        notes: values.notes || undefined,
        createdAt: new Date().toISOString(),
      },
    ])

    await new Promise((resolve) => setTimeout(resolve, 800))

    setDestinations((prev) =>
      prev.map((d) => (d.id === tempId ? { ...d, status: Status.CONNECTED } : d)),
    )
    setIsConnecting(false)
    toast.success(`${values.displayName} saved`)
  }, [])

  const removeDestination = useCallback((id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    toast.success('Destination removed')
  }, [])

  const disconnectDestination = useCallback((id: string) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: Status.DISCONNECTED } : d)),
    )
    toast.success('Destination disconnected')
  }, [])

  const reconnectDestination = useCallback((id: string) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: Status.CONNECTED } : d)),
    )
    toast.success('Destination reconnected')
  }, [])

  return {
    destinations,
    isConnecting,
    connectYouTube,
    connectFacebook,
    connectTwitch,
    connectCustomRTMP,
    removeDestination,
    disconnectDestination,
    reconnectDestination,
  }
}
