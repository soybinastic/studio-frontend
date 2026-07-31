import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BackgroundPicker } from '@/components/studio/sidebar/BackgroundPicker'
import type { LayoutType } from '@/types/session'
import type { GraphicsState } from '@/types/graphics'
import { layoutSupportsBackground } from '@/lib/graphics'

interface BackgroundSectionProps {
  layout: LayoutType
  background: GraphicsState['background']
  disabled?: boolean
  onSelect: (url: string) => void
  onClear: () => void
  onFitChange: (fit: 'cover' | 'stretch') => void
}

export function BackgroundSection({
  layout,
  background,
  disabled,
  onSelect,
  onClear,
  onFitChange,
}: BackgroundSectionProps) {
  const isActive = Boolean(background?.is_active && background.url)
  const backgroundSupported = layoutSupportsBackground(layout)

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">Background</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a thumbnail to apply. Visible on Contain and Fullscreen layouts.
      </p>

      {isActive && !backgroundSupported && (
        <p className="flex items-start gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          Background is hidden on {layout} — switch to Contain or Fullscreen to see it on the frame.
        </p>
      )}

      <BackgroundPicker
        selectedUrl={isActive ? background?.url : undefined}
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
    </div>
  )
}
