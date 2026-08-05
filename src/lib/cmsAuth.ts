const CMS_ACCESS_TOKEN_KEY = 'cms_access_token'
const CMS_STUDIO_UUID_KEY = 'cms_studio_uuid'

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function readQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)?.trim() || null
}

function stripQueryParams(names: string[]): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  let changed = false
  for (const name of names) {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name)
      changed = true
    }
  }
  if (changed) {
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }
}

/**
 * Capture CMS JWT + studio UUID from the iframe query string on load.
 * Stores them in sessionStorage and strips `token` from the visible URL.
 */
export function bootstrapCmsAuthFromLocation(): void {
  if (!canUseSessionStorage()) return

  const token = readQueryParam('token')
  const studioUuid = readQueryParam('studio_uuid')

  if (token) {
    sessionStorage.setItem(CMS_ACCESS_TOKEN_KEY, token)
  }
  if (studioUuid) {
    sessionStorage.setItem(CMS_STUDIO_UUID_KEY, studioUuid)
  }

  if (token || studioUuid) {
    // Always strip token; also strip studio_uuid to avoid leaking identifiers in shareable URLs.
    stripQueryParams(['token', 'studio_uuid'])
  }
}

export function getCmsAccessToken(): string | null {
  if (!canUseSessionStorage()) return null
  return sessionStorage.getItem(CMS_ACCESS_TOKEN_KEY)?.trim() || null
}

export function getCmsStudioUuid(): string | null {
  if (!canUseSessionStorage()) return null
  return sessionStorage.getItem(CMS_STUDIO_UUID_KEY)?.trim() || null
}

export function canUploadCmsAssets(): boolean {
  return Boolean(getCmsAccessToken() && getCmsStudioUuid())
}
