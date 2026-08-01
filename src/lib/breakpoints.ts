/**
 * Centralized responsive breakpoints (px).
 *
 * Mobile:        0 – 767
 * Tablet:        768 – 1023
 * Laptop:       1024 – 1365
 * Desktop:      1366 – 1919
 * Large desktop: 1920+
 */
export const BREAKPOINTS = {
  tablet: 768,
  laptop: 1024,
  desktop: 1366,
  largeDesktop: 1920,
} as const

export type BreakpointName = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'largeDesktop'

export function breakpointFromWidth(width: number): BreakpointName {
  if (width >= BREAKPOINTS.largeDesktop) return 'largeDesktop'
  if (width >= BREAKPOINTS.desktop) return 'desktop'
  if (width >= BREAKPOINTS.laptop) return 'laptop'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'mobile'
}

export function isDrawerBreakpoint(name: BreakpointName): boolean {
  return name === 'mobile'
}

export function panelDefaultExpanded(name: BreakpointName): boolean {
  return name === 'laptop' || name === 'desktop' || name === 'largeDesktop'
}
