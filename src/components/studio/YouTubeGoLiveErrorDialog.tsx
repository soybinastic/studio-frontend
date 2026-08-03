import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  YOUTUBE_STUDIO_URL,
  type YouTubeGoLiveErrorVariant,
} from '@/lib/youtubeGoLiveErrors'

const LIVE_NOT_ENABLED_STEPS = [
  'Open YouTube Studio',
  'Go to Settings → Feature eligibility',
  'Enable Live streaming',
  'Verify your phone number if prompted',
  'Wait up to 24 hours, then try going live again',
] as const

interface YouTubeGoLiveErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: YouTubeGoLiveErrorVariant
}

export function YouTubeGoLiveErrorDialog({
  open,
  onOpenChange,
  variant = 'live_not_enabled',
}: YouTubeGoLiveErrorDialogProps) {
  const isLiveNotEnabled = variant === 'live_not_enabled'

  const openYouTubeStudio = () => {
    window.open(YOUTUBE_STUDIO_URL, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isLiveNotEnabled
              ? 'YouTube live streaming not enabled'
              : "Couldn't prepare YouTube stream"}
          </DialogTitle>
          <DialogDescription>
            {isLiveNotEnabled
              ? "Your YouTube account connected successfully, but this channel isn't allowed to go live yet."
              : 'We could not create a YouTube broadcast or stream key before going live. Check your YouTube account settings and try again.'}
          </DialogDescription>
        </DialogHeader>

        {isLiveNotEnabled ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {LIVE_NOT_ENABLED_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            If live streaming is not enabled on your channel, open YouTube Studio and enable it under
            Feature eligibility.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
          <Button type="button" variant="live" onClick={openYouTubeStudio}>
            Open YouTube Studio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
