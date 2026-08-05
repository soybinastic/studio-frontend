import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Disc3 } from 'lucide-react'
import type { BackgroundMusicPreset } from '@/lib/backgroundMusicPresets'
import { cn } from '@/lib/utils'

interface BackgroundMusicPickerProps {
  selectedAssetId?: string | null
  disabled?: boolean
  studioTracks?: BackgroundMusicPreset[]
  customTracks?: BackgroundMusicPreset[]
  onSelect: (preset: BackgroundMusicPreset) => void
}

const STUDIO_TRACKS_VISIBLE = 6

function PresetRow({
  preset,
  isSelected,
  disabled,
  onSelect,
}: {
  preset: BackgroundMusicPreset
  isSelected: boolean
  disabled?: boolean
  onSelect: (preset: BackgroundMusicPreset) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(preset)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors',
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border/60 hover:border-primary/40 hover:bg-muted/40',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      aria-label={`Select ${preset.title}`}
      aria-pressed={isSelected}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60">
        <Disc3 className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{preset.title}</span>
        {preset.default ? (
          <span className="block text-[10px] text-muted-foreground">Studio track</span>
        ) : (
          <span className="block text-[10px] text-muted-foreground">Custom upload</span>
        )}
      </span>
      {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
    </button>
  )
}

export function BackgroundMusicPicker({
  selectedAssetId,
  disabled,
  studioTracks = [],
  customTracks = [],
  onSelect,
}: BackgroundMusicPickerProps) {
  const [showMore, setShowMore] = useState(false)
  const visibleStudioTracks = studioTracks.slice(0, STUDIO_TRACKS_VISIBLE)
  const extraStudioTracks = studioTracks.slice(STUDIO_TRACKS_VISIBLE)

  return (
    <div className="space-y-2">
      {customTracks.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Your uploads
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
            {customTracks.map((preset) => (
              <PresetRow
                key={preset.uuid}
                preset={preset}
                isSelected={selectedAssetId === preset.uuid}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Studio tracks
      </p>
      {studioTracks.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          No studio tracks available yet. Seed defaults or upload a custom track.
        </p>
      ) : (
        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {visibleStudioTracks.map((preset) => (
            <PresetRow
              key={preset.uuid}
              preset={preset}
              isSelected={selectedAssetId === preset.uuid}
              disabled={disabled}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {extraStudioTracks.length > 0 ? (
        <div className="space-y-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowMore((open) => !open)}
            className="flex w-full items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {showMore ? (
              <>
                Hide more tracks
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show more tracks ({extraStudioTracks.length})
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>

          {showMore ? (
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {extraStudioTracks.map((preset) => (
                <PresetRow
                  key={preset.uuid}
                  preset={preset}
                  isSelected={selectedAssetId === preset.uuid}
                  disabled={disabled}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
