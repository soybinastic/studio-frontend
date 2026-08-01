import { LogoPicker } from '@/components/studio/sidebar/LogoPicker'
import { LogoPlacementPicker } from '@/components/studio/sidebar/LogoPlacementPicker'
import { GraphicsCollapsibleSection } from '@/components/studio/sidebar/GraphicsCollapsibleSection'
import type { GraphicsState, LogoPlacement } from '@/types/graphics'
import { DEFAULT_LOGO_PLACEMENT, getLogoPlacement, type LogoPreset } from '@/lib/logoPresets'
import { resolveGraphicUrl } from '@/lib/graphics'

interface LogoSectionProps {
  presets?: LogoPreset[]
  logo: GraphicsState['logo']
  disabled?: boolean
  onSelect: (url: string) => void
  onPlacementChange: (placement: LogoPlacement) => void
  onClear: () => void
}

export function LogoSection({
  presets,
  logo,
  disabled,
  onSelect,
  onPlacementChange,
  onClear,
}: LogoSectionProps) {
  const isActive = Boolean(logo?.is_active && resolveGraphicUrl(logo))
  const placement = isActive ? getLogoPlacement(logo) : DEFAULT_LOGO_PLACEMENT

  return (
    <GraphicsCollapsibleSection
      title="Logo"
      description="Click a thumbnail to apply. Choose which corner it appears in on the frame."
      isActive={isActive}
    >
      <LogoPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(logo) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />

      {isActive && (
        <LogoPlacementPicker value={placement} disabled={disabled} onChange={onPlacementChange} />
      )}
    </GraphicsCollapsibleSection>
  )
}
