import type { BannerThemeStyle } from '@/types/graphics'
import {
  BANNER_THEME_STYLES,
  bannerBarStyle,
  bannerShapeClassName,
  DEFAULT_BRAND_COLORS,
  normalizeBannerTheme,
} from '@/lib/bannerThemes'
import { cn } from '@/lib/utils'

interface ThemeStylePickerProps {
  value: BannerThemeStyle
  disabled?: boolean
  onChange: (theme: BannerThemeStyle) => void
}

function ThemePreview({ theme }: { theme: BannerThemeStyle }) {
  const colors = DEFAULT_BRAND_COLORS
  const titleStyle = bannerBarStyle(theme, 'title', colors)
  const descStyle = bannerBarStyle(theme, 'description', colors)
  const shape = bannerShapeClassName(theme)

  return (
    <div className="space-y-0.5">
      <div className={cn('h-2 px-1', shape)} style={titleStyle} />
      <div className={cn('h-1.5 px-1 opacity-90', shape)} style={descStyle} />
    </div>
  )
}

export function ThemeStylePicker({ value, disabled, onChange }: ThemeStylePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BANNER_THEME_STYLES.map((style) => {
        const isSelected = value === style.id
        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            className={cn(
              'rounded-md border-2 px-2 py-2 text-left transition-all',
              isSelected
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border/60 hover:border-primary/50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            aria-label={`Select ${style.label} theme`}
            aria-pressed={isSelected}
          >
            <ThemePreview theme={style.id} />
            <span className="mt-1 block text-[10px] font-medium">{style.label}</span>
            <span className="block text-[9px] text-muted-foreground">{style.description}</span>
          </button>
        )
      })}
    </div>
  )
}

export function getActiveBannerTheme(theme: string | undefined): BannerThemeStyle {
  return normalizeBannerTheme(theme)
}
