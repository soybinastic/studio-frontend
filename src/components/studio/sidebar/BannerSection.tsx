import { Label } from '@/components/ui/label'
import { BannerPicker } from '@/components/studio/sidebar/BannerPicker'
import type { GraphicsState } from '@/types/graphics'

interface BannerSectionProps {
  banner: GraphicsState['banner']
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear: () => void
}

export function BannerSection({ banner, disabled, onSelect, onClear }: BannerSectionProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Banner</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a preset to show a lower-third. Width adjusts to the text length.
      </p>

      <BannerPicker banner={banner} disabled={disabled} onSelect={onSelect} onClear={onClear} />
    </div>
  )
}
