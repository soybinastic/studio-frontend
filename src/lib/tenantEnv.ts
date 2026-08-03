const DEFAULT_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'
const DEFAULT_TENANT_NAME = 'My Studio'

function getTenantIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const fromQuery = new URLSearchParams(window.location.search).get('tenant_id')?.trim()
  return fromQuery || null
}

export function getTenantIdFromEnv(): string {
  return getTenantIdFromUrl() || import.meta.env.VITE_TENANT_ID?.trim() || DEFAULT_TENANT_ID
}

export function getTenantNameFromEnv(): string {
  return import.meta.env.VITE_TENANT_NAME?.trim() || DEFAULT_TENANT_NAME
}

export function isPersistenceEnabled(): boolean {
  return import.meta.env.VITE_PERSISTENCE_ENABLED !== 'false'
}
