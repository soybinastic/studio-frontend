import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { StudioHeaderControlsProps } from '@/components/studio/toolbar/StudioHeaderControls'

interface StudioHeaderControlsContextValue {
  controls: StudioHeaderControlsProps | null
  setControls: (controls: StudioHeaderControlsProps | null) => void
}

const StudioHeaderControlsContext = createContext<StudioHeaderControlsContextValue | null>(null)

export function StudioHeaderControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControlsState] = useState<StudioHeaderControlsProps | null>(null)

  const setControls = useCallback((next: StudioHeaderControlsProps | null) => {
    setControlsState(next)
  }, [])

  const value = useMemo(
    () => ({
      controls,
      setControls,
    }),
    [controls, setControls],
  )

  return (
    <StudioHeaderControlsContext.Provider value={value}>
      {children}
    </StudioHeaderControlsContext.Provider>
  )
}

export function useStudioHeaderControls() {
  const context = useContext(StudioHeaderControlsContext)
  if (!context) {
    throw new Error('useStudioHeaderControls must be used within StudioHeaderControlsProvider')
  }
  return context
}
