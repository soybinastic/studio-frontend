import { AlertCircle } from 'lucide-react'
import { BackgroundPicker } from '@/components/studio/sidebar/BackgroundPicker'
import { GraphicsCollapsibleSection } from '@/components/studio/sidebar/GraphicsCollapsibleSection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BackgroundPreset } from '@/lib/backgroundPresets'
import type { LayoutType } from '@/types/session'
import type { GraphicsState } from '@/types/graphics'
import { layoutSupportsBackground, resolveGraphicUrl } from '@/lib/graphics'

interface BackgroundSectionProps {
  presets?: BackgroundPreset[]
  layout: LayoutType
  background: GraphicsState['background']
  disabled?: boolean
  onSelect: (url: string) => void
  onClear: () => void
  onFitChange: (fit: 'cover' | 'stretch') => void
}

export function BackgroundSection({
  presets,
  layout,
  background,
  disabled,
  onSelect,
  onClear,
  onFitChange,
}: BackgroundSectionProps) {
  const isActive = Boolean(background?.is_active && resolveGraphicUrl(background))
  const backgroundSupported = layoutSupportsBackground(layout)

  return (
    <GraphicsCollapsibleSection
      title="Background"
      description="Click a thumbnail to apply. Visible on Contain and Fullscreen layouts."
      isActive={isActive}
    >
      {isActive && !backgroundSupported && (
        <p className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          Background is hidden on {layout} — switch to Contain or Fullscreen to see it on the frame.
        </p>
      )}

      <BackgroundPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(background) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />

      {isActive && (
        <Select
          value={background?.fit ?? 'cover'}
          onValueChange={(fit) => onFitChange(fit as 'cover' | 'stretch')}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="stretch">Stretch</SelectItem>
          </SelectContent>
        </Select>
      )}
    </GraphicsCollapsibleSection>
  )
}
