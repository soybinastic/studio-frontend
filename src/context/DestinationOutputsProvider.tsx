import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
  const destinationsState = useDestinations()

  const openDestinations = useCallback(() => setOpen(true), [])
  const closeDestinations = useCallback(() => setOpen(false), [])

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
