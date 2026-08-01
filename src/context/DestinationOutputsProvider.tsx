import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DestinationOutputsModal } from '@/components/destinations/DestinationOutputsModal'
import { useDestinations } from '@/hooks/useDestinations'

interface DestinationOutputsContextValue {
  open: boolean
  openDestinations: () => void
  closeDestinations: () => void
}

const DestinationOutputsContext = createContext<DestinationOutputsContextValue | null>(null)

export function DestinationOutputsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const destinationsState = useDestinations({
    onTwitchConnected: () => setOpen(true),
  })
  const { reload } = destinationsState

  const openDestinations = useCallback(() => setOpen(true), [])
  const closeDestinations = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const twitchResult = searchParams.get('twitch')
    if (!twitchResult) return

    const message = searchParams.get('message')

    if (twitchResult === 'connected') {
      void reload().then(() => {
        toast.success('Twitch connected successfully')
        setOpen(true)
      })
    } else if (twitchResult === 'error') {
      toast.error(message ? decodeURIComponent(message.replace(/\+/g, ' ')) : 'Twitch connection failed')
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('twitch')
    nextParams.delete('message')
    nextParams.delete('connection_id')
    nextParams.delete('platform')
    setSearchParams(nextParams, { replace: true })
  }, [reload, searchParams, setSearchParams])

  const value = useMemo(
    () => ({ open, openDestinations, closeDestinations }),
    [open, openDestinations, closeDestinations],
  )

  return (
    <DestinationOutputsContext.Provider value={value}>
      {children}
      <DestinationOutputsModal
        open={open}
        onOpenChange={setOpen}
        {...destinationsState}
      />
    </DestinationOutputsContext.Provider>
  )
}

export function useDestinationOutputs() {
  const context = useContext(DestinationOutputsContext)
  if (!context) {
    throw new Error('useDestinationOutputs must be used within DestinationOutputsProvider')
  }
  return context
}
