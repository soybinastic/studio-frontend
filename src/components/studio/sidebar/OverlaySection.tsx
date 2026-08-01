import { Label } from '@/components/ui/label'
import { OverlayPicker } from '@/components/studio/sidebar/OverlayPicker'
import type { GraphicsState } from '@/types/graphics'
import { resolveGraphicUrl } from '@/lib/graphics'
import type { OverlayPreset } from '@/lib/overlayPresets'

interface OverlaySectionProps {
  presets?: OverlayPreset[]
  overlay: GraphicsState['overlay']
  disabled?: boolean
  onSelect: (url: string) => void
  onClear: () => void
}

export function OverlaySection({
  presets,
  overlay,
  disabled,
  onSelect,
  onClear,
}: OverlaySectionProps) {
  const isActive = Boolean(overlay?.is_active && resolveGraphicUrl(overlay))

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Overlay</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a thumbnail to apply. Renders on top of the video frame.
      </p>

      <OverlayPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(overlay) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />
    </div>
  )
}
