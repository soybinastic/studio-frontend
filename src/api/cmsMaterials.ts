import { ApiError } from '@/api/client'
import { getCmsAccessToken, getCmsStudioUuid } from '@/lib/cmsAuth'

const CMS_API_BASE = (import.meta.env.VITE_CMS_API_URL ?? 'http://localhost:8000/api/v1').replace(
  /\/+$/,
  '',
)

export type CmsMaterialType = 1 | 2 | 4

export interface CmsMaterialUploadResponse {
  message?: string
  uuid: string
  source: string
  thumbnail?: string | null
}

export interface CmsMusicUploadResponse {
  message?: string
  uuid: string
  title: string
  source: string
}

const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const VIDEO_MAX_BYTES = 10 * 1024 * 1024
const AUDIO_MAX_BYTES = 10 * 1024 * 1024

const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac', 'opus'])

async function parseCmsError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string; detail?: string }
    return data.message ?? data.detail ?? response.statusText
  } catch {
    return response.statusText
  }
}

function fileExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName) return fromName
  const fromType = file.type.split('/').pop()?.toLowerCase()
  return fromType || 'bin'
}

function requireCmsAuth(): { token: string; studioUuid: string } {
  const token = getCmsAccessToken()
  const studioUuid = getCmsStudioUuid()
  if (!token || !studioUuid) {
    throw new Error('CMS authentication is required to upload assets')
  }
  return { token, studioUuid }
}

export function validateGraphicUpload(file: File, type: CmsMaterialType): string | null {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  if (type === 4) {
    if (!isImage && !isVideo) return 'Background must be an image or video file'
  } else if (!isImage) {
    return 'File must be an image'
  }

  if (isImage && file.size > IMAGE_MAX_BYTES) {
    return 'Image must be 5 MB or smaller'
  }
  if (isVideo && file.size > VIDEO_MAX_BYTES) {
    return 'Video must be 10 MB or smaller'
  }
  return null
}

export function validateMusicUpload(file: File): string | null {
  const ext = fileExtension(file)
  const isAudioMime = file.type.startsWith('audio/') || file.type === ''
  if (!isAudioMime && !AUDIO_EXTENSIONS.has(ext)) {
    return 'Music must be an audio file (mp3, wav, aac, flac, ogg, …)'
  }
  if (file.size > AUDIO_MAX_BYTES) {
    return 'Music file must be 10 MB or smaller'
  }
  return null
}

export async function uploadStudioMaterial(params: {
  file: File
  type: CmsMaterialType
  metaData?: Record<string, unknown>
}): Promise<CmsMaterialUploadResponse> {
  const { token, studioUuid } = requireCmsAuth()
  const validationError = validateGraphicUpload(params.file, params.type)
  if (validationError) {
    throw new Error(validationError)
  }

  const formData = new FormData()
  formData.append('file', params.file)
  formData.append(
    'options',
    JSON.stringify({
      studio_uuid: studioUuid,
      type: params.type,
      ext: fileExtension(params.file),
      end: true,
      offset: 0,
      current_chunk: params.file.size,
      ...(params.metaData ? { meta_data: params.metaData } : {}),
    }),
  )

  const response = await fetch(`${CMS_API_BASE}/material/save-single/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseCmsError(response))
  }

  return response.json() as Promise<CmsMaterialUploadResponse>
}

export async function uploadStudioMusic(params: {
  file: File
  title?: string
}): Promise<CmsMusicUploadResponse> {
  const { token, studioUuid } = requireCmsAuth()
  const validationError = validateMusicUpload(params.file)
  if (validationError) {
    throw new Error(validationError)
  }

  const title = params.title?.trim() || params.file.name.replace(/\.[^.]+$/, '') || 'Custom track'
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append(
    'details',
    JSON.stringify({
      studio_id: studioUuid,
      title,
      size: params.file.size,
    }),
  )

  const response = await fetch(`${CMS_API_BASE}/studio/music/upload/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseCmsError(response))
  }

  return response.json() as Promise<CmsMusicUploadResponse>
}
