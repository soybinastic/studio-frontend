import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { CustomRTMPFormErrors, CustomRTMPFormValues } from '@/types/destinations'
import { PlatformIcon } from '@/components/destinations/PlatformIcon'
import { DestinationPlatform as Platform } from '@/types/destinations'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface CustomRTMPFormProps {
  onSubmit: (values: CustomRTMPFormValues) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

function validate(values: CustomRTMPFormValues): CustomRTMPFormErrors {
  const errors: CustomRTMPFormErrors = {}
  if (!values.displayName.trim()) {
    errors.displayName = 'Display name is required'
  }
  if (!values.rtmpUrl.trim()) {
    errors.rtmpUrl = 'RTMP URL is required'
  } else if (!/^rtmp(s)?:\/\/.+/i.test(values.rtmpUrl.trim())) {
    errors.rtmpUrl = 'Enter a valid RTMP URL (rtmp:// or rtmps://)'
  }
  if (!values.streamKey.trim()) {
    errors.streamKey = 'Stream key is required'
  }
  return errors
}

export function CustomRTMPForm({ onSubmit, onCancel, isSubmitting }: CustomRTMPFormProps) {
  const [values, setValues] = useState<CustomRTMPFormValues>({
    displayName: '',
    rtmpUrl: '',
    streamKey: '',
    notes: '',
  })
  const [errors, setErrors] = useState<CustomRTMPFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof CustomRTMPFormValues, boolean>>>({})

  const handleBlur = (field: keyof CustomRTMPFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors(validate(values))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setTouched({ displayName: true, rtmpUrl: true, streamKey: true })
    if (Object.keys(nextErrors).length > 0) return
    await onSubmit(values)
  }

  const fieldError = (field: keyof CustomRTMPFormErrors) =>
    touched[field] ? errors[field] : undefined

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex items-center gap-4">
        <PlatformIcon platform={Platform.CUSTOM_RTMP} size="lg" />
        <div>
          <h3 className="text-lg font-semibold">Custom RTMP</h3>
          <p className="text-sm text-muted-foreground">
            Enter your RTMP server details to connect a custom destination.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtmp-display-name">Display Name</Label>
        <Input
          id="rtmp-display-name"
          placeholder="My RTMP Server"
          value={values.displayName}
          onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
          onBlur={() => handleBlur('displayName')}
          aria-invalid={!!fieldError('displayName')}
          aria-describedby={fieldError('displayName') ? 'rtmp-display-name-error' : undefined}
          disabled={isSubmitting}
        />
        {fieldError('displayName') && (
          <p id="rtmp-display-name-error" className="text-xs text-destructive" role="alert">
            {fieldError('displayName')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtmp-url">RTMP URL</Label>
        <Input
          id="rtmp-url"
          placeholder="rtmp://live.example.com/app"
          value={values.rtmpUrl}
          onChange={(e) => setValues((v) => ({ ...v, rtmpUrl: e.target.value }))}
          onBlur={() => handleBlur('rtmpUrl')}
          aria-invalid={!!fieldError('rtmpUrl')}
          aria-describedby={fieldError('rtmpUrl') ? 'rtmp-url-error' : undefined}
          disabled={isSubmitting}
        />
        {fieldError('rtmpUrl') && (
          <p id="rtmp-url-error" className="text-xs text-destructive" role="alert">
            {fieldError('rtmpUrl')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtmp-stream-key">Stream Key</Label>
        <Input
          id="rtmp-stream-key"
          type="password"
          placeholder="Your stream key"
          value={values.streamKey}
          onChange={(e) => setValues((v) => ({ ...v, streamKey: e.target.value }))}
          onBlur={() => handleBlur('streamKey')}
          aria-invalid={!!fieldError('streamKey')}
          aria-describedby={fieldError('streamKey') ? 'rtmp-stream-key-error' : undefined}
          disabled={isSubmitting}
          autoComplete="off"
        />
        {fieldError('streamKey') && (
          <p id="rtmp-stream-key-error" className="text-xs text-destructive" role="alert">
            {fieldError('streamKey')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtmp-notes">
          Notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="rtmp-notes"
          placeholder="Any notes about this destination…"
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  )
}
