import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BannerFormFields } from '@/components/studio/sidebar/forms/BannerFormFields'
import { TickerFormFields } from '@/components/studio/sidebar/forms/TickerFormFields'
import {
  DEFAULT_BANNER_FORM,
  DEFAULT_TICKER_FORM,
  buildBannerGraphic,
  buildTickerGraphic,
  isBannerFormValid,
  isTickerFormValid,
  type BannerFormValues,
  type TickerFormValues,
} from '@/lib/bannerTickerBuilders'
import type { BannerGraphic, TickerGraphic } from '@/types/graphics'

interface BannerTickerConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: { banner: BannerGraphic; ticker?: TickerGraphic }) => void
  isSaving?: boolean
}

export function BannerTickerConfigModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: BannerTickerConfigModalProps) {
  const [bannerValues, setBannerValues] = useState<BannerFormValues>(DEFAULT_BANNER_FORM)
  const [includeTicker, setIncludeTicker] = useState(false)
  const [tickerValues, setTickerValues] = useState<TickerFormValues>(DEFAULT_TICKER_FORM)

  useEffect(() => {
    if (!open) return
    setBannerValues({ ...DEFAULT_BANNER_FORM })
    setIncludeTicker(false)
    setTickerValues({ ...DEFAULT_TICKER_FORM })
  }, [open])

  const bannerValid = isBannerFormValid(bannerValues)
  const tickerValid = !includeTicker || isTickerFormValid(tickerValues)
  const canSave = bannerValid && tickerValid

  const handleSave = () => {
    if (!canSave) return
    const banner = buildBannerGraphic(bannerValues)
    const payload: { banner: BannerGraphic; ticker?: TickerGraphic } = { banner }
    if (includeTicker) {
      payload.ticker = buildTickerGraphic({
        ...tickerValues,
        primary: tickerValues.primary || bannerValues.primary,
        secondary: tickerValues.secondary,
      })
    }
    onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create banner</DialogTitle>
          <DialogDescription>
            Configure a lower-third banner. Optionally add a scrolling ticker at the same time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <BannerFormFields
            values={bannerValues}
            disabled={isSaving}
            onChange={(patch) => setBannerValues((current) => ({ ...current, ...patch }))}
          />

          <div className="space-y-3 border-t border-border/40 pt-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={includeTicker}
                disabled={isSaving}
                onChange={(e) => setIncludeTicker(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm font-medium">Also add scrolling ticker</span>
            </label>

            {includeTicker && (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">Ticker</Label>
                <TickerFormFields
                  values={tickerValues}
                  disabled={isSaving}
                  onChange={(patch) => setTickerValues((current) => ({ ...current, ...patch }))}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || !canSave}>
            {includeTicker ? 'Save banner & ticker' : 'Save banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
