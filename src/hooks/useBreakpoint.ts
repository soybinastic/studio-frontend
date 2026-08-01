import { useEffect, useState } from 'react'
import {
  breakpointFromWidth,
  type BreakpointName,
  isDrawerBreakpoint,
  panelDefaultExpanded,
} from '@/lib/breakpoints'

function getBreakpoint(): BreakpointName {
  if (typeof window === 'undefined') return 'desktop'
  return breakpointFromWidth(window.innerWidth)
}

export function useBreakpoint(): BreakpointName {
  const [breakpoint, setBreakpoint] = useState<BreakpointName>(getBreakpoint)

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint())
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  return breakpoint
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

export function useIsDrawerMode(): boolean {
  const breakpoint = useBreakpoint()
  return isDrawerBreakpoint(breakpoint)
}

export function usePanelDefaultExpanded(): boolean {
  const breakpoint = useBreakpoint()
  return panelDefaultExpanded(breakpoint)
}
