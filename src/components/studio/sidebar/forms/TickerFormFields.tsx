import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TickerFormValues } from '@/lib/bannerTickerBuilders'

interface TickerFormFieldsProps {
  values: TickerFormValues
  disabled?: boolean
  onChange: (patch: Partial<TickerFormValues>) => void
}

export function TickerFormFields({ values, disabled, onChange }: TickerFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ticker-text" className="text-xs uppercase tracking-wide text-muted-foreground">
          Scrolling text
        </Label>
        <textarea
          id="ticker-text"
          value={values.tickerText}
          disabled={disabled}
          onChange={(e) => onChange({ tickerText: e.target.value })}
          placeholder="Welcome to the live stream — say hi in the chat!"
          rows={3}
          className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="responsive-form-grid">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Position</Label>
          <Select
            value={values.tickerPosition}
            onValueChange={(value) => onChange({ tickerPosition: value as 'top' | 'bottom' })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="top">Top</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Direction</Label>
          <Select
            value={values.tickerDirection}
            onValueChange={(value) => onChange({ tickerDirection: value as 'rtl' | 'ltr' })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rtl">Right to left</SelectItem>
              <SelectItem value="ltr">Left to right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ticker-speed" className="text-xs uppercase tracking-wide text-muted-foreground">
          Speed
        </Label>
        <Input
          id="ticker-speed"
          type="number"
          min={0.1}
          max={10}
          step={0.1}
          value={values.tickerSpeed}
          disabled={disabled}
          onChange={(e) => onChange({ tickerSpeed: Number(e.target.value) || 2.0 })}
          className="h-8 text-sm"
        />
      </div>

      <div className="space-y-2 border-t border-border/40 pt-3">
        <p className="text-[10px] font-medium text-muted-foreground">Ticker colors</p>
        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
          <Label htmlFor="ticker-primary" className="text-[10px]">
            Bar
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="ticker-primary"
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

          <Label htmlFor="ticker-secondary" className="text-[10px]">
            Text
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="ticker-secondary"
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
        </div>
      </div>
    </div>
  )
}
