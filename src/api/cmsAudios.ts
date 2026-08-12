import { ApiError } from '@/api/client'
import { getCmsAccessToken } from '@/lib/cmsAuth'

function resolveCmsOrigin(): string {
  const raw = (import.meta.env.VITE_CMS_API_URL ?? 'http://localhost:8000/api/v1').replace(
    /\/+$/,
    '',
  )
  return raw.replace(/\/api\/v[13]$/i, '')
}

async function parseCmsError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; detail?: string }
    return data.message ?? data.detail ?? response.statusText
  } catch {
    return response.statusText
  }
}

/** Stub — audio library wiring is deferred. */
export interface CmsAudio {
  uuid: string
  title: string
  source_file: string | null
  output_file: string | null
  thumbnail: string | null
  duration: string | null
}

/** Normalized list envelope (CMS CustomPagination → DRF-like fields). */
export interface CmsAudioListResult {
  count: number
  next: string | null
  previous: string | null
  page: number
  pageSize: number
  results: CmsAudio[]
}

interface CmsPaginatedAudioResponse {
  count?: number
  total?: number
  next?: string | null
  previous?: string | null
  page?: number
  page_size?: number
  links?: {
    next?: string | null
    previous?: string | null
  }
  results?: CmsAudio[]
}

function normalizeCmsAudioList(
  raw: CmsPaginatedAudioResponse,
  fallbackPage: number,
  fallbackPageSize: number,
): CmsAudioListResult {
  const results = Array.isArray(raw.results) ? raw.results : []
  const count = Number(raw.total ?? raw.count ?? results.length) || 0
  return {
    count,
    next: raw.links?.next ?? raw.next ?? null,
    previous: raw.links?.previous ?? raw.previous ?? null,
    page: Number(raw.page ?? fallbackPage) || fallbackPage,
    pageSize: Number(raw.page_size ?? fallbackPageSize) || fallbackPageSize,
    results,
  }
}

export async function listCmsAudios(params?: {
  page?: number
  pageSize?: number
}): Promise<CmsAudioListResult> {
  const token = getCmsAccessToken()
  if (!token) {
    throw new Error('CMS authentication is required to list audios')
  }

  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const origin = resolveCmsOrigin()
  const url = new URL(`${origin}/api/v3/audios/`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('page_size', String(pageSize))
  url.searchParams.set('ordering', '-created')
  url.searchParams.set('status', 'VISIBLE')
  url.searchParams.set('excludestatus', 'DELETED')
  url.searchParams.set('jobstatus', 'COMPLETED')

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseCmsError(response))
  }

  const raw = (await response.json()) as CmsPaginatedAudioResponse
  return normalizeCmsAudioList(raw, page, pageSize)
}
