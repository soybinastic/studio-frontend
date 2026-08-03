import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FacebookPagePickerState } from '@/hooks/useDestinations'
import type { FacebookTarget } from '@/types/destinations'
import { DestinationPlatform as Platform } from '@/types/destinations'
import type { PlatformDefinition } from '@/constants/destinations'
import { PlatformIcon } from '@/components/destinations/PlatformIcon'
import { cn } from '@/lib/utils'

interface PlatformConnectViewProps {
  platform: PlatformDefinition
  onBack: () => void
  onConnect: (facebookTarget?: FacebookTarget) => void | Promise<void>
  isConnecting?: boolean
  facebookPagePicker?: FacebookPagePickerState | null
  onFacebookPageConnected?: () => void
}

const FACEBOOK_TARGETS: { id: FacebookTarget; label: string; description: string }[] = [
  { id: 'profile', label: 'Facebook Profile', description: 'Stream to your personal profile' },
  { id: 'page', label: 'Facebook Page', description: 'Stream to a page you manage' },
]

export function PlatformConnectView({
  platform,
  onBack,
  onConnect,
  isConnecting,
  facebookPagePicker,
  onFacebookPageConnected,
}: PlatformConnectViewProps) {
  const [facebookTarget, setFacebookTarget] = useState<FacebookTarget>('profile')
  const [selectingPageId, setSelectingPageId] = useState<string | null>(null)
  const isFacebook = platform.id === Platform.FACEBOOK
  const showPagePicker = isFacebook && Boolean(facebookPagePicker)

  const handleConnect = () => {
    if (isFacebook) {
      void onConnect(facebookTarget)
    } else {
      void onConnect()
    }
  }

  const handleBack = () => {
    if (showPagePicker) {
      facebookPagePicker?.cancel()
      return
    }
    onBack()
  }

  const handleSelectPage = async (pageId: string) => {
    if (!facebookPagePicker || selectingPageId) return
    setSelectingPageId(pageId)
    try {
      const ok = await facebookPagePicker.selectPage(pageId)
      if (ok) {
        onFacebookPageConnected?.()
      }
    } finally {
      setSelectingPageId(null)
    }
  }

  if (showPagePicker && facebookPagePicker) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <PlatformIcon platform={platform.id} size="lg" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">Select a Facebook Page</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {facebookPagePicker.accountName
                ? `Choose a page to stream as ${facebookPagePicker.accountName}.`
                : 'Choose the page you want to stream to.'}
            </p>
          </div>
        </div>

        {facebookPagePicker.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Facebook pages found for this account.</p>
        ) : (
          <ul className="space-y-2">
            {facebookPagePicker.pages.map((page) => {
              const isSelecting = selectingPageId === page.id
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                      'hover:border-primary/40 hover:bg-accent/30',
                      isSelecting && 'border-primary/50 bg-primary/5',
                    )}
                    disabled={Boolean(selectingPageId) || isConnecting}
                    onClick={() => void handleSelectPage(page.id)}
                  >
                    <span className="font-medium">{page.name}</span>
                    {isSelecting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleBack} disabled={Boolean(selectingPageId)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <PlatformIcon platform={platform.id} size="lg" />
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">{platform.connectTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{platform.connectDescription}</p>
        </div>
      </div>

      {isFacebook && (
        <fieldset className="space-y-3" disabled={isConnecting}>
          <legend className="sr-only">Choose Facebook destination</legend>
          {FACEBOOK_TARGETS.map((target) => (
            <label
              key={target.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                'hover:border-primary/40 hover:bg-accent/30',
                facebookTarget === target.id
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border/60',
              )}
            >
              <input
                type="radio"
                name="facebook-target"
                value={target.id}
                checked={facebookTarget === target.id}
                onChange={() => setFacebookTarget(target.id)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div>
                <p className="font-medium">{target.label}</p>
                <p className="text-sm text-muted-foreground">{target.description}</p>
              </div>
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleBack} disabled={isConnecting}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting…
            </>
          ) : (
            platform.oauthLabel
          )}
        </Button>
      </div>
    </div>
  )
}
