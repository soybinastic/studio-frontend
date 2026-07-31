import type { LogoPlacement } from '@/types/graphics'
import { LOGO_PLACEMENTS } from '@/lib/logoPresets'
import { cn } from '@/lib/utils'

const PLACEMENT_LABELS: Record<LogoPlacement, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
}

const PLACEMENT_GRID: Record<LogoPlacement, string> = {
  'top-left': 'col-start-1 row-start-1',
  'top-right': 'col-start-2 row-start-1',
  'bottom-left': 'col-start-1 row-start-2',
  'bottom-right': 'col-start-2 row-start-2',
}

interface LogoPlacementPickerProps {
  value: LogoPlacement
  disabled?: boolean
  onChange: (placement: LogoPlacement) => void
}

export function LogoPlacementPicker({ value, disabled, onChange }: LogoPlacementPickerProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground">Corner placement</p>
      <div className="grid max-w-[180px] grid-cols-2 grid-rows-2 gap-1">
        {LOGO_PLACEMENTS.map((placement) => {
          const isSelected = value === placement
          return (
            <button
              key={placement}
              type="button"
              disabled={disabled}
              onClick={() => onChange(placement)}
              className={cn(
                'rounded-md border px-1 py-2 text-[8px] font-medium leading-tight transition-colors',
                PLACEMENT_GRID[placement],
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              aria-label={PLACEMENT_LABELS[placement]}
              aria-pressed={isSelected}
            >
              {PLACEMENT_LABELS[placement]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
