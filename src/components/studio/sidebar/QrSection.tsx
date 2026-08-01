import { Label } from '@/components/ui/label'
import { QrPicker } from '@/components/studio/sidebar/QrPicker'
import { QrPositionPicker } from '@/components/studio/sidebar/QrPositionPicker'
import type { GraphicsState, QrPlacement } from '@/types/graphics'
import { DEFAULT_QR_PLACEMENT, getQrPlacement } from '@/lib/qrGeometry'
import { resolveGraphicUrl } from '@/lib/graphics'
import type { QrPreset } from '@/lib/qrPresets'

interface QrSectionProps {
  presets?: QrPreset[]
  qr: GraphicsState['qr']
  disabled?: boolean
  onSelect: (url: string) => void
  onPlacementChange: (placement: QrPlacement) => void
  onClear: () => void
}

export function QrSection({
  presets,
  qr,
  disabled,
  onSelect,
  onPlacementChange,
  onClear,
}: QrSectionProps) {
  const isActive = Boolean(qr?.is_shown && resolveGraphicUrl(qr))
  const placement = isActive ? getQrPlacement(qr) : DEFAULT_QR_PLACEMENT

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <Label className="text-xs font-semibold uppercase tracking-wide">QR Code</Label>
      <p className="text-[10px] text-muted-foreground">
        Click a thumbnail to apply, then choose where it appears on the frame.
      </p>

      <QrPicker
        presets={presets}
        selectedUrl={isActive ? resolveGraphicUrl(qr) : undefined}
        disabled={disabled}
        onSelect={onSelect}
        onClear={onClear}
      />

      {isActive && (
        <QrPositionPicker
          value={placement}
          disabled={disabled}
          onChange={onPlacementChange}
        />
      )}
    </div>
  )
}
