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
import { TickerFormFields } from '@/components/studio/sidebar/forms/TickerFormFields'
import {
  DEFAULT_TICKER_FORM,
  buildTickerGraphic,
  isTickerFormValid,
  type TickerFormValues,
} from '@/lib/bannerTickerBuilders'
import type { TickerGraphic } from '@/types/graphics'

interface TickerConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (ticker: TickerGraphic) => void
  isSaving?: boolean
}

export function TickerConfigModal({
  open,
  onOpenChange,
  onSave,
  isSaving,
}: TickerConfigModalProps) {
  const [values, setValues] = useState<TickerFormValues>(DEFAULT_TICKER_FORM)

  useEffect(() => {
    if (!open) return
    setValues({ ...DEFAULT_TICKER_FORM })
  }, [open])

  const canSave = isTickerFormValid(values)

  const handleSave = () => {
    if (!canSave) return
    onSave(buildTickerGraphic(values))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create ticker</DialogTitle>
          <DialogDescription>
            Configure scrolling text that appears at the top or bottom of the frame.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <TickerFormFields
            values={values}
            disabled={isSaving}
            onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || !canSave}>
            Save ticker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
