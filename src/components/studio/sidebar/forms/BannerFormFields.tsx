import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeStylePicker } from '@/components/studio/sidebar/ThemeStylePicker'
import type { BannerFormValues } from '@/lib/bannerTickerBuilders'

interface BannerFormFieldsProps {
  values: BannerFormValues
  disabled?: boolean
  onChange: (patch: Partial<BannerFormValues>) => void
}

export function BannerFormFields({ values, disabled, onChange }: BannerFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="banner-title" className="text-xs uppercase tracking-wide text-muted-foreground">
          Title
        </Label>
        <Input
          id="banner-title"
          value={values.title}
          disabled={disabled}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Alex Rivera"
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="banner-description"
          className="text-xs uppercase tracking-wide text-muted-foreground"
        >
          Description
        </Label>
        <Input
          id="banner-description"
          value={values.description}
          disabled={disabled}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Live from Studio A"
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme style</Label>
        <ThemeStylePicker
          value={values.theme}
          disabled={disabled}
          onChange={(theme) => onChange({ theme })}
        />
      </div>

      <div className="space-y-2 border-t border-border/40 pt-3">
        <p className="text-[10px] font-medium text-muted-foreground">Brand colors</p>
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <Label htmlFor="banner-form-primary" className="text-[10px]">
            Primary
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-form-primary"
              value={values.primary}
              disabled={disabled}
              onChange={(e) => onChange({ primary: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={values.primary}
              disabled={disabled}
              onChange={(e) => onChange({ primary: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <Label htmlFor="banner-form-secondary" className="text-[10px]">
            Secondary
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-form-secondary"
              value={values.secondary}
              disabled={disabled}
              onChange={(e) => onChange({ secondary: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={values.secondary}
              disabled={disabled}
              onChange={(e) => onChange({ secondary: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <Label htmlFor="banner-form-accent" className="text-[10px]">
            Accent
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="banner-form-accent"
              value={values.accent}
              disabled={disabled}
              onChange={(e) => onChange({ accent: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border border-border/60 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              value={values.accent}
              disabled={disabled}
              onChange={(e) => onChange({ accent: e.target.value })}
              className="h-7 text-xs"
            />
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground">
          Primary → title bar · Secondary → description · Accent → borders and accent bars
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-font-size" className="text-xs uppercase tracking-wide text-muted-foreground">
          Font size
        </Label>
        <Input
          id="banner-font-size"
          type="number"
          min={8}
          max={200}
          value={values.font_size}
          disabled={disabled}
          onChange={(e) => onChange({ font_size: Number(e.target.value) || 32 })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
