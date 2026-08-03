import { persistenceRequest } from '@/api/persistenceClient'
import type { PersistedPlatformConnection } from '@/types/persistence'
import type { PlatformConnectionEmbedImportRequest } from '@/lib/integration/mapEmbedPlatformImport'

export function listPlatformConnections(tenantId: string) {
  return persistenceRequest<PersistedPlatformConnection[]>(
    `/tenant/${tenantId}/platform-connections/`,
  )
}

export function deletePlatformConnection(tenantId: string, connectionId: string) {
  return persistenceRequest<void>(`/tenant/${tenantId}/platform-connections/${connectionId}/`, {
    method: 'DELETE',
  })
}

export function disconnectPlatformConnection(tenantId: string, connectionId: string) {
  return persistenceRequest<PersistedPlatformConnection>(
    `/tenant/${tenantId}/platform-connections/${connectionId}/disconnect/`,
    { method: 'POST' },
  )
}

export function refreshPlatformConnection(tenantId: string, connectionId: string) {
  return persistenceRequest<PersistedPlatformConnection>(
    `/tenant/${tenantId}/platform-connections/${connectionId}/refresh/`,
    { method: 'POST' },
  )
}

export function getTwitchAuthorizeUrl(tenantId: string, returnUrl: string) {
  const params = new URLSearchParams({
    tenant_id: tenantId,
    return_url: returnUrl,
  })
  return persistenceRequest<{ authorize_url: string }>(`/oauth/twitch/authorize/?${params}`)
}

/** Persist CMS embed OAuth result (parent ran OAuth; iframe stores credentials). */
export function importPlatformConnectionFromEmbed(
  tenantId: string,
  body: PlatformConnectionEmbedImportRequest,
) {
  return persistenceRequest<PersistedPlatformConnection>(
    `/tenant/${tenantId}/platform-connections/import/`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}
