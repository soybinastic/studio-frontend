import { Check } from 'lucide-react'
import { BANNER_PRESETS, isSameBannerPreset } from '@/lib/bannerTickerPresets'
import {
  bannerBarStyle,
  bannerShapeClassName,
  normalizeBannerTheme,
  pickTextColor,
  resolveBannerBrandColors,
} from '@/lib/bannerThemes'
import type { BannerGraphic } from '@/types/graphics'
import { cn } from '@/lib/utils'

interface BannerPickerProps {
  banner: BannerGraphic | null | undefined
  disabled?: boolean
  onSelect: (presetId: string) => void
  onClear?: () => void
}

function BannerPresetPreview({ banner }: { banner: BannerGraphic }) {
  const theme = normalizeBannerTheme(banner.theme)
  const colors = resolveBannerBrandColors(banner)
  const shapeClass = bannerShapeClassName(theme)
  const titleStyle = bannerBarStyle(theme, 'title', colors)

  return (
    <div className={cn('inline-block px-2 py-0.5', shapeClass)} style={titleStyle}>
      <span className="block truncate text-[10px] font-semibold">{banner.title}</span>
      {banner.description && (
        <span
          className="block truncate text-[9px] opacity-90"
          style={{ color: pickTextColor(colors.secondary) }}
        >
          {banner.description}
        </span>
      )}
    </div>
  )
}

export function BannerPicker({ banner, disabled, onSelect, onClear }: BannerPickerProps) {
  const activePreset = BANNER_PRESETS.find((preset) => isSameBannerPreset(banner, preset))

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {BANNER_PRESETS.map((preset) => {
          const isSelected = isSameBannerPreset(banner, preset)
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset.id)}
              className={cn(
                'relative rounded-md border-2 px-3 py-2 text-left transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border/60 hover:border-primary/50',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-label={`Select ${preset.label} banner`}
              aria-pressed={isSelected}
            >
              <BannerPresetPreview banner={preset.banner} />
              <span className="text-[9px] text-muted-foreground">{preset.label}</span>
              {isSelected && (
                <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />
              )}
            </button>
          )
        })}
      </div>

      {activePreset && onClear && (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Remove banner
        </button>
      )}
    </div>
  )
}
