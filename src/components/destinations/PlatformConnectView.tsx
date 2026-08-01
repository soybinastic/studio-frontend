import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
}: PlatformConnectViewProps) {
  const [facebookTarget, setFacebookTarget] = useState<FacebookTarget>('profile')
  const isFacebook = platform.id === Platform.FACEBOOK

  const handleConnect = () => {
    if (isFacebook) {
      void onConnect(facebookTarget)
    } else {
      void onConnect()
    }
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
        <fieldset className="space-y-3">
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
        <Button type="button" variant="outline" onClick={onBack} disabled={isConnecting}>
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
