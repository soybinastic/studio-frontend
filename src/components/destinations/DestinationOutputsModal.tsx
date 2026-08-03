import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  ConnectedDestination,
  CustomRTMPFormValues,
  DestinationModalStep,
  FacebookTarget,
} from '@/types/destinations'
import { DestinationPlatform as Platform } from '@/types/destinations'
import {
  MODAL_STEP_BY_PLATFORM,
  PLATFORM_BY_ID,
  PLATFORM_DEFINITIONS,
} from '@/constants/destinations'
import type { ConnectFacebookResult, FacebookPagePickerState } from '@/hooks/useDestinations'
import { PlatformSelector } from '@/components/destinations/PlatformSelector'
import { PlatformConnectView } from '@/components/destinations/PlatformConnectView'
import { CustomRTMPForm } from '@/components/destinations/CustomRTMPForm'
import { DestinationGrid } from '@/components/destinations/DestinationGrid'
import { EmptyDestinationState } from '@/components/destinations/EmptyDestinationState'

interface DestinationOutputsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinations: ConnectedDestination[]
  isConnecting: boolean
  connectYouTube: () => void | Promise<void>
  connectFacebook: (target: FacebookTarget) => Promise<ConnectFacebookResult>
  connectTwitch: () => void | Promise<void>
  connectCustomRTMP: (values: CustomRTMPFormValues) => void | Promise<void>
  facebookPagePicker?: FacebookPagePickerState | null
  clearFacebookPagePicker?: () => void
  removeDestination: (id: string) => void
  disconnectDestination: (id: string) => void
  reconnectDestination: (id: string) => void
}

function stepToPlatform(step: DestinationModalStep) {
  switch (step) {
    case 'connect-youtube':
      return PLATFORM_BY_ID[Platform.YOUTUBE]
    case 'connect-facebook':
      return PLATFORM_BY_ID[Platform.FACEBOOK]
    case 'connect-twitch':
      return PLATFORM_BY_ID[Platform.TWITCH]
    default:
      return null
  }
}

export function DestinationOutputsModal({
  open,
  onOpenChange,
  destinations,
  isConnecting,
  connectYouTube,
  connectFacebook,
  connectTwitch,
  connectCustomRTMP,
  facebookPagePicker,
  clearFacebookPagePicker,
  removeDestination,
  disconnectDestination,
  reconnectDestination,
}: DestinationOutputsModalProps) {
  const [step, setStep] = useState<DestinationModalStep>('list')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const resetToList = useCallback(() => {
    setStep('list')
    setDirection('back')
  }, [])

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetToList, 200)
      return () => clearTimeout(timer)
    }
  }, [open, resetToList])

  const goToStep = (next: DestinationModalStep) => {
    const stepOrder: DestinationModalStep[] = [
      'list',
      'select',
      'connect-youtube',
      'connect-facebook',
      'connect-twitch',
      'custom-rtmp',
    ]
    const currentIdx = stepOrder.indexOf(step)
    const nextIdx = stepOrder.indexOf(next)
    setDirection(nextIdx >= currentIdx ? 'forward' : 'back')
    setStep(next)
  }

  const handlePlatformSelect = (platformId: (typeof PLATFORM_DEFINITIONS)[number]['id']) => {
    if (platformId === Platform.CUSTOM_RTMP) {
      goToStep('custom-rtmp')
      return
    }
    goToStep(MODAL_STEP_BY_PLATFORM[platformId])
  }

  const handleBack = () => {
    if (step === 'select') {
      goToStep('list')
    } else {
      goToStep('select')
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen && (isConnecting || facebookPagePicker)) {
      clearFacebookPagePicker?.()
    }
    if (!nextOpen && isConnecting) return
    onOpenChange(nextOpen)
  }

  const handleOAuthConnect = async (facebookTarget?: FacebookTarget) => {
    let shouldReset = true

    switch (step) {
      case 'connect-youtube':
        await connectYouTube()
        break
      case 'connect-facebook':
        if (facebookTarget) {
          const result = await connectFacebook(facebookTarget)
          shouldReset = result === 'completed'
        }
        break
      case 'connect-twitch':
        await connectTwitch()
        break
    }

    if (shouldReset) {
      resetToList()
    }
  }

  const handleCustomSubmit = async (values: CustomRTMPFormValues) => {
    await connectCustomRTMP(values)
    resetToList()
  }

  const platform = stepToPlatform(step)
  const animationClass =
    direction === 'forward' ? 'destination-animate-forward' : 'destination-animate-back'

  const title =
    step === 'list'
      ? 'Destination Outputs'
      : step === 'select'
        ? 'Choose Destination'
        : step === 'custom-rtmp'
          ? 'Custom RTMP'
          : platform?.connectTitle ?? 'Connect Destination'

  const description =
    step === 'list'
      ? 'Connect streaming destinations to broadcast your live sessions to multiple platforms simultaneously.'
      : step === 'select'
        ? 'Select a platform to connect your streaming destination.'
        : step === 'custom-rtmp'
          ? 'Configure your custom RTMP server.'
          : platform?.connectDescription

  const isWide = step === 'list'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          isWide
            ? 'max-h-[min(92dvh,calc(100dvh-2rem))] overflow-y-auto sm:max-w-2xl'
            : 'max-h-[min(92dvh,calc(100dvh-2rem))] overflow-y-auto sm:max-w-xl'
        }
        aria-describedby="destination-outputs-description"
        onPointerDownOutside={(e) => (isConnecting || facebookPagePicker) && e.preventDefault()}
        onEscapeKeyDown={(e) => (isConnecting || facebookPagePicker) && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="destination-outputs-description">{description}</DialogDescription>
        </DialogHeader>

        <div key={step} className={animationClass}>
          {step === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <Button onClick={() => goToStep('select')} size="sm">
                  <Plus className="h-4 w-4" />
                  Connect Destination
                </Button>
              </div>
              <DestinationGrid
                destinations={destinations}
                onDisconnect={disconnectDestination}
                onReconnect={reconnectDestination}
                onRemove={removeDestination}
                emptyState={
                  <EmptyDestinationState onConnect={() => goToStep('select')} />
                }
              />
            </div>
          )}

          {step === 'select' && (
            <PlatformSelector platforms={PLATFORM_DEFINITIONS} onSelect={handlePlatformSelect} />
          )}

          {platform && (
            <PlatformConnectView
              platform={platform}
              onBack={handleBack}
              onConnect={handleOAuthConnect}
              isConnecting={isConnecting}
              facebookPagePicker={facebookPagePicker}
              onFacebookPageConnected={resetToList}
            />
          )}

          {step === 'custom-rtmp' && (
            <CustomRTMPForm
              onSubmit={handleCustomSubmit}
              onCancel={handleBack}
              isSubmitting={isConnecting}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
