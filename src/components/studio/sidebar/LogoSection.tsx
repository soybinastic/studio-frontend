import { Label } from '@/components/ui/label'
import { LogoPicker } from '@/components/studio/sidebar/LogoPicker'
import { LogoPlacementPicker } from '@/components/studio/sidebar/LogoPlacementPicker'
import type { GraphicsState, LogoPlacement } from '@/types/graphics'
import { DEFAULT_LOGO_PLACEMENT, getLogoPlacement } from '@/lib/logoPresets'

interface LogoSectionProps {
  logo: GraphicsState['logo']
  disabled?: boolean
  onSelect: (url: string) => void
  onPlacementChange: (placement: LogoPlacement) => void
  onClear: () => void
}

export function LogoSection({
  logo,
  disabled,
  onSelect,
  onPlacementChange,
  onClear,
}: LogoSectionProps) {
  const isActive = Boolean(logo?.is_active && logo.url)
  const placement = isActive ? getLogoPlacement(logo) : DEFAULT_LOGO_PLACEMENT

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Logo</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a thumbnail to apply. Choose which corner it appears in on the frame.
      </p>

      <LogoPicker
        selectedUrl={isActive ? logo?.url : undefined}
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
