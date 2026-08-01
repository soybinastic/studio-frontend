import { Check } from 'lucide-react'
import { OVERLAY_PRESETS, type OverlayPreset } from '@/lib/overlayPresets'
import { cn } from '@/lib/utils'

interface OverlayPickerProps {
  presets?: OverlayPreset[]
  selectedUrl?: string
  disabled?: boolean
  onSelect: (url: string) => void
  onClear?: () => void
}

export function OverlayPicker({
  presets = OVERLAY_PRESETS,
  selectedUrl,
  disabled,
  onSelect,
  onClear,
}: OverlayPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {presets.map((preset) => {
          const isSelected = selectedUrl === preset.url
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(preset.url)}
              className={cn(
                'group relative aspect-video overflow-hidden rounded-md border-2 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border/60 hover:border-primary/50',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-label={`Select ${preset.label} overlay`}
              aria-pressed={isSelected}
            >
              <img
                src={preset.thumbnail ?? preset.url}
                alt={preset.label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <Check className="h-4 w-4 text-primary drop-shadow" />
                </span>
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-1">
                <span className="block truncate text-[9px] font-medium text-white">{preset.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      {selectedUrl && onClear && (
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
        >
          Remove overlay
        </button>
      )}
    </div>
  )
}
