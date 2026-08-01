import { Label } from '@/components/ui/label'
import { LogoPicker } from '@/components/studio/sidebar/LogoPicker'
import { LogoPlacementPicker } from '@/components/studio/sidebar/LogoPlacementPicker'
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
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Logo</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a thumbnail to apply. Choose which corner it appears in on the frame.
      </p>

      <LogoPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(logo) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />

      {isActive && (
        <LogoPlacementPicker
          value={placement}
          disabled={disabled}
          onChange={onPlacementChange}
        />
      )}
    </div>
  )
}
