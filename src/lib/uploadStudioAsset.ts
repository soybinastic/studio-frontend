import {
  uploadStudioMaterial,
  uploadStudioMusic,
  type CmsMaterialType,
} from '@/api/cmsMaterials'
import { createTenantMediaAsset, createTenantMusicTrack } from '@/api/persistence'
import { getPersistenceTenantId } from '@/lib/persistenceSync'
import type { StudioMediaAsset, TenantMusicTrack } from '@/types/persistence'

function mediaFormatForFile(file: File, type: CmsMaterialType): 'image' | 'video' {
  if (type === 4 && file.type.startsWith('video/')) return 'video'
  return 'image'
}

export async function uploadAndRegisterGraphic(params: {
  file: File
  type: CmsMaterialType
}): Promise<StudioMediaAsset> {
  const tenantId = getPersistenceTenantId()
  if (!tenantId) {
    throw new Error('Tenant is not ready')
  }

  const uploaded = await uploadStudioMaterial({
    file: params.file,
    type: params.type,
  })

  return createTenantMediaAsset(tenantId, {
    asset_type: params.type,
    source: uploaded.source,
    thumbnail: uploaded.thumbnail ?? null,
    size: params.file.size,
    media_format: mediaFormatForFile(params.file, params.type),
    label: params.file.name.replace(/\.[^.]+$/, '') || undefined,
    meta_data: { cms_material_uuid: uploaded.uuid },
  })
}

export async function uploadAndRegisterMusic(params: {
  file: File
  title?: string
}): Promise<TenantMusicTrack> {
  const tenantId = getPersistenceTenantId()
  if (!tenantId) {
    throw new Error('Tenant is not ready')
  }

  const uploaded = await uploadStudioMusic({
    file: params.file,
    title: params.title,
  })

  return createTenantMusicTrack(tenantId, {
    title: uploaded.title || params.title || params.file.name,
    source: uploaded.source,
    size: params.file.size,
    meta_data: { cms_music_uuid: uploaded.uuid },
  })
}
