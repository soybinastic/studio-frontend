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

export interface CmsVideo {
  uuid: string
  title: string
  source_file: string | null
  output_file: string | null
  thumbnail: string | null
  duration: string | null
}

export interface CmsVideoListResult {
  count: number
  next: string | null
  previous: string | null
  results: CmsVideo[]
}

export async function listCmsVideos(params?: {
  page?: number
  pageSize?: number
}): Promise<CmsVideoListResult> {
  const token = getCmsAccessToken()
  if (!token) {
    throw new Error('CMS authentication is required to list videos')
  }

  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const origin = resolveCmsOrigin()
  const url = new URL(`${origin}/api/v3/videos/`)
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

  return response.json() as Promise<CmsVideoListResult>
}
