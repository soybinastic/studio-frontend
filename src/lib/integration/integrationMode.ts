/**
 * Integration mode for studio-frontend.
 *
 * - `standalone`: studio handles OAuth via studio-persistence (default).
 * - `embedded`: CMS parent handles OAuth; studio delegates via postMessage.
 */
export type IntegrationMode = 'standalone' | 'embedded'

export function getIntegrationModeFromEnv(): IntegrationMode {
  const raw = import.meta.env.VITE_INTEGRATION_MODE?.trim().toLowerCase()
  return raw === 'embedded' ? 'embedded' : 'standalone'
}

export function getIntegrationModeFromLocation(search = window.location.search): IntegrationMode {
  const params = new URLSearchParams(search)
  const queryMode = params.get('integration')?.trim().toLowerCase()
  if (queryMode === 'embedded') return 'embedded'
  if (queryMode === 'standalone') return 'standalone'
  return getIntegrationModeFromEnv()
}

export function isEmbeddedIntegration(): boolean {
  return getIntegrationModeFromLocation() === 'embedded'
}

export function getEmbedParentOrigins(): string[] {
  const raw = import.meta.env.VITE_EMBED_PARENT_ORIGINS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean)
}

export function isAllowedEmbedParentOrigin(origin: string): boolean {
  const allowed = getEmbedParentOrigins()
  if (allowed.length === 0) {
    return origin !== window.location.origin
  }
  return allowed.includes(origin)
}
