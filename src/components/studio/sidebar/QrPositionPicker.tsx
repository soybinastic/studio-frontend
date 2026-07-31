import type { QrPlacement } from '@/types/graphics'
import { QR_PLACEMENTS } from '@/lib/qrGeometry'
import { cn } from '@/lib/utils'

const PLACEMENT_LABELS: Record<QrPlacement, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  center: 'Center',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
}

const PLACEMENT_GRID: Record<QrPlacement, string> = {
  'top-left': 'col-start-1 row-start-1',
  'top-right': 'col-start-3 row-start-1',
  center: 'col-start-2 row-start-2',
  'bottom-left': 'col-start-1 row-start-3',
  'bottom-right': 'col-start-3 row-start-3',
}

interface QrPositionPickerProps {
  value: QrPlacement
  disabled?: boolean
  onChange: (placement: QrPlacement) => void
}

export function QrPositionPicker({ value, disabled, onChange }: QrPositionPickerProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground">Position on frame</p>
      <div className="grid max-w-[220px] grid-cols-3 grid-rows-3 gap-1">
        {QR_PLACEMENTS.map((placement) => {
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
