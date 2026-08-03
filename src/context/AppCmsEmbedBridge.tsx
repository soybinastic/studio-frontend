import type { ReactNode } from 'react'
import { useMatch } from 'react-router-dom'
import { CmsEmbedBridgeProvider } from '@/context/CmsEmbedBridgeProvider'
import { useTenant } from '@/context/TenantProvider'

/**
 * App-level CMS embed bridge so Destinations (AppShell modal) shares postMessage
 * context with the studio route — not only StudioLayout.
 */
export function AppCmsEmbedBridge({ children }: { children: ReactNode }) {
  const studioMatch = useMatch('/studio/:sessionId')
  const sessionId = studioMatch?.params.sessionId
  const { tenantId } = useTenant()

  return (
    <CmsEmbedBridgeProvider sessionId={sessionId} tenantId={tenantId}>
      {children}
    </CmsEmbedBridgeProvider>
  )
}
