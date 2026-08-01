import { OverlayPicker } from '@/components/studio/sidebar/OverlayPicker'
import { GraphicsCollapsibleSection } from '@/components/studio/sidebar/GraphicsCollapsibleSection'
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
    <GraphicsCollapsibleSection
      title="Overlay"
      description="Click a thumbnail to apply. Renders on top of the video frame."
      isActive={isActive}
    >
      <OverlayPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(overlay) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />
    </GraphicsCollapsibleSection>
  )
}
