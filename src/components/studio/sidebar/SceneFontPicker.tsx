import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { GraphicsCollapsibleSection } from '@/components/studio/sidebar/GraphicsCollapsibleSection'
import { listStudioFontFamilies } from '@/lib/typography/catalog'
import { resolveDisplayFont } from '@/lib/typography/policy'
import { cssFontFamily, ensureFontLoaded } from '@/lib/typography/cssAdapter'
import { cn } from '@/lib/utils'

interface SceneFontPickerProps {
  fonts: string | null | undefined
  disabled?: boolean
  onChange: (fontFamily: string) => void
}

export function SceneFontPicker({ fonts, disabled, onChange }: SceneFontPickerProps) {
  const selected = resolveDisplayFont(fonts)
  const families = listStudioFontFamilies()

  useEffect(() => {
    ensureFontLoaded(selected)
  }, [selected])

  return (
    <GraphicsCollapsibleSection
      title="Font Family"
      description="Applies to all text overlays on this scene — banner, ticker, and chat."
      defaultOpen
      isActive={Boolean(fonts)}
    >
      <div className="space-y-2">
        <Label htmlFor="scene-font-family" className="text-[10px]">
          Family
        </Label>
        <select
          id="scene-font-family"
          value={selected}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'flex h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          style={{ fontFamily: cssFontFamily(selected) }}
        >
          {families.map((family) => (
            <option key={family} value={family} style={{ fontFamily: cssFontFamily(family) }}>
              {family}
            </option>
          ))}
        </select>
      </div>
    </GraphicsCollapsibleSection>
  )
}
