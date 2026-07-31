import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeStylePicker, getActiveBannerTheme } from '@/components/studio/sidebar/ThemeStylePicker'
import type { BannerGraphic, BannerThemeStyle } from '@/types/graphics'
import { bannerShouldShow } from '@/lib/graphics'
import { DEFAULT_BANNER_ACCENT } from '@/lib/bannerThemes'

interface ThemeStyleSectionProps {
  banner: BannerGraphic | null | undefined
  disabled?: boolean
  onThemeChange: (theme: BannerThemeStyle) => void
  onColorsChange: (colors: { primary?: string; secondary?: string; accent?: string }) => void
}

export function ThemeStyleSection({
  banner,
  disabled,
  onThemeChange,
  onColorsChange,
}: ThemeStyleSectionProps) {
  const bannerActive = bannerShouldShow(banner)
  const theme = getActiveBannerTheme(banner?.theme)
  const sectionDisabled = disabled || !bannerActive

  return (
    <div className="space-y-3 rounded-lg border border-border/60 p-3">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide">Theme Style</Label>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Controls the banner lower-third shape only — not ticker, logo, or background text.
        </p>
        {!bannerActive && (
          <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
            Select a banner preset first to apply a theme style.
          </p>
        )}
      </div>

      <ThemeStylePicker value={theme} disabled={sectionDisabled} onChange={onThemeChange} />

      <div className="space-y-2 border-t border-border/40 pt-3">
        <p className="text-[10px] font-medium text-muted-foreground">Brand colors</p>

        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <Label htmlFor="banner-primary" className="text-[10px]">
            Primary
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-primary"
              value={banner?.primary || '#111111'}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ primary: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={banner?.primary ?? '#111111'}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ primary: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <Label htmlFor="banner-secondary" className="text-[10px]">
            Secondary
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-secondary"
              value={banner?.secondary || '#374151'}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ secondary: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={banner?.secondary ?? '#374151'}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ secondary: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <Label htmlFor="banner-accent" className="text-[10px]">
            Accent
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-accent"
              value={banner?.accent ?? DEFAULT_BANNER_ACCENT}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ accent: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={banner?.accent ?? DEFAULT_BANNER_ACCENT}
              disabled={sectionDisabled}
              onChange={(e) => onColorsChange({ accent: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground">
          Primary → title bar · Secondary → description bar · Accent → borders and accent bars
        </p>
      </div>
    </div>
  )
}
