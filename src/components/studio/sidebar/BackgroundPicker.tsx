import { Check, Film } from 'lucide-react'
import { BACKGROUND_PRESETS, type BackgroundPreset } from '@/lib/backgroundPresets'
import { cn } from '@/lib/utils'

interface BackgroundPickerProps {
  presets?: BackgroundPreset[]
  selectedUrl?: string
  disabled?: boolean
  onSelect: (url: string) => void
  onClear?: () => void
}

export function BackgroundPicker({
  presets = BACKGROUND_PRESETS,
  selectedUrl,
  disabled,
  onSelect,
  onClear,
}: BackgroundPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {presets.map((preset) => {
          const isSelected = selectedUrl === preset.url
          const previewSrc = preset.thumbnail ?? preset.url
          const isVideo = preset.type === 'video'

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
              aria-label={`Select ${preset.label} background`}
              aria-pressed={isSelected}
            >
              {isVideo && !preset.thumbnail ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900/80 text-muted-foreground">
                  <Film className="h-5 w-5" />
                </div>
              ) : (
                <img
                  src={previewSrc}
                  alt={preset.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              {isVideo && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-medium uppercase text-white">
                  Video
                </span>
              )}
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
          Remove background
        </button>
      )}
    </div>
  )
}
