import { useMemo } from 'react'
import { useTenantOptional } from '@/context/TenantProvider'
import {
  backgroundPresetsFromCatalog,
  logoPresetsFromCatalog,
  overlayPresetsFromCatalog,
  qrPresetsFromCatalog,
  type QrCatalogPreset,
} from '@/lib/assetCatalogPresets'
import type { BackgroundPreset } from '@/lib/backgroundPresets'
import type { LogoPreset } from '@/lib/logoPresets'
import type { OverlayPreset } from '@/lib/overlayPresets'

export function useAssetCatalog(): {
  backgrounds: BackgroundPreset[]
  overlays: OverlayPreset[]
  logos: LogoPreset[]
  qrCodes: QrCatalogPreset[]
} {
  const tenant = useTenantOptional()
  const catalog = tenant?.configuration?.asset_catalog

  return useMemo(
    () => ({
      backgrounds: backgroundPresetsFromCatalog(catalog),
      overlays: overlayPresetsFromCatalog(catalog),
      logos: logoPresetsFromCatalog(catalog),
      qrCodes: qrPresetsFromCatalog(catalog),
    }),
    [catalog],
  )
}
