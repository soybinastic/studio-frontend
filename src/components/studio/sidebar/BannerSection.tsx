import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BannerPicker } from '@/components/studio/sidebar/BannerPicker'
import type { GraphicsState } from '@/types/graphics'
import { bannerShouldShow } from '@/lib/graphics'

interface BannerSectionProps {
  banner: GraphicsState['banner']
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear: () => void
  onCreateCustom?: () => void
}

export function BannerSection({
  banner,
  disabled,
  onSelect,
  onClear,
  onCreateCustom,
}: BannerSectionProps) {
  const isActive = bannerShouldShow(banner)

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wide">Banner</Label>
          <p className="text-[10px] text-muted-foreground">
            Use a preset or create a custom lower-third. Optionally add a ticker in the same flow.
          </p>
        </div>
        {onCreateCustom && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-[10px]"
            disabled={disabled}
            onClick={onCreateCustom}
          >
            <Plus className="h-3 w-3" />
            Create
          </Button>
        )}
      </div>

      {isActive && banner && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
          <p className="text-[10px] font-medium">{banner.title}</p>
          {banner.description && (
            <p className="truncate text-[9px] text-muted-foreground">{banner.description}</p>
          )}
        </div>
      )}

      <BannerPicker banner={banner} disabled={disabled} onSelect={onSelect} onClear={onClear} />
    </div>
  )
}
