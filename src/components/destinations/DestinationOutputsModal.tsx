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
  OAUTH_PLATFORM_DEFINITIONS,
  PLATFORM_BY_ID,
} from '@/constants/destinations'
import {
  CUSTOM_RTMP_PRESET,
  RTMP_PLATFORM_PRESETS,
  type RtmpPlatformPreset,
} from '@/constants/rtmpPlatforms'
import type { ConnectFacebookResult, FacebookPagePickerState } from '@/hooks/useDestinations'
import { PlatformSelector } from '@/components/destinations/PlatformSelector'
import { PlatformConnectView } from '@/components/destinations/PlatformConnectView'
import { CustomRTMPForm } from '@/components/destinations/CustomRTMPForm'
import { DestinationGrid } from '@/components/destinations/DestinationGrid'
import { EmptyDestinationState } from '@/components/destinations/EmptyDestinationState'
import { RtmpPlatformCard } from '@/components/destinations/RtmpPlatformCard'

interface DestinationOutputsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinations: ConnectedDestination[]
  isConnecting: boolean
  connectYouTube: () => void | Promise<void>
  connectFacebook: (target: FacebookTarget) => Promise<ConnectFacebookResult>
  connectTwitch: () => void | Promise<void>
  connectCustomRTMP: (values: CustomRTMPFormValues, platformId: string) => void | Promise<void>
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
  const [rtmpPreset, setRtmpPreset] = useState<RtmpPlatformPreset>(CUSTOM_RTMP_PRESET)

  const resetToList = useCallback(() => {
    setStep('list')
    setDirection('back')
    setRtmpPreset(CUSTOM_RTMP_PRESET)
  }, [])

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetToList, 200)
      return () => clearTimeout(timer)
    }
  }, [open, resetToList])

  useEffect(() => {
    if (!open || !facebookPagePicker) return
    if (step === 'connect-facebook') return
    setDirection('forward')
    setStep('connect-facebook')
  }, [open, facebookPagePicker, step])

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

  const handleOAuthPlatformSelect = (
    platformId: (typeof OAUTH_PLATFORM_DEFINITIONS)[number]['id'],
  ) => {
    goToStep(MODAL_STEP_BY_PLATFORM[platformId as keyof typeof MODAL_STEP_BY_PLATFORM])
  }

  const handleRtmpPresetSelect = (preset: RtmpPlatformPreset) => {
    setRtmpPreset(preset)
    goToStep('custom-rtmp')
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
    await connectCustomRTMP(values, rtmpPreset.id)
    resetToList()
  }

  const handleReconnect = (id: string) => {
    const destination = destinations.find((d) => d.id === id)
    if (destination?.platform === Platform.FACEBOOK) {
      goToStep('connect-facebook')
    } else if (destination?.platform === Platform.TWITCH) {
      goToStep('connect-twitch')
    } else if (destination?.platform === Platform.YOUTUBE) {
      goToStep('connect-youtube')
    }
    reconnectDestination(id)
  }

  const facebookPagePickerForView = facebookPagePicker
    ? {
        ...facebookPagePicker,
        cancel: () => {
          facebookPagePicker.cancel()
          resetToList()
        },
      }
    : null

  const platform = stepToPlatform(step)
  const animationClass =
    direction === 'forward' ? 'destination-animate-forward' : 'destination-animate-back'

  const title =
    step === 'list'
      ? 'Destination Outputs'
      : step === 'select'
        ? 'Choose Destination'
        : step === 'custom-rtmp'
          ? rtmpPreset.name
          : platform?.connectTitle ?? 'Connect Destination'

  const description =
    step === 'list'
      ? 'Connect streaming destinations to broadcast your live sessions to multiple platforms simultaneously.'
      : step === 'select'
        ? 'Choose an integrated platform or add an RTMP destination with your stream URL and key.'
        : step === 'custom-rtmp'
          ? rtmpPreset.description
          : platform?.connectDescription

  const isWide = step === 'list' || step === 'select'

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
                onReconnect={handleReconnect}
                onRemove={removeDestination}
                emptyState={
                  <EmptyDestinationState onConnect={() => goToStep('select')} />
                }
              />
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Integrated destinations</h3>
                <PlatformSelector
                  platforms={OAUTH_PLATFORM_DEFINITIONS}
                  onSelect={handleOAuthPlatformSelect}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">RTMP destinations</h3>
                <div
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  role="listbox"
                  aria-label="Choose an RTMP streaming destination"
                >
                  {RTMP_PLATFORM_PRESETS.map((preset) => (
                    <RtmpPlatformCard
                      key={preset.id}
                      preset={preset}
                      onSelect={() => handleRtmpPresetSelect(preset)}
                    />
                  ))}
                  <RtmpPlatformCard
                    preset={CUSTOM_RTMP_PRESET}
                    onSelect={() => handleRtmpPresetSelect(CUSTOM_RTMP_PRESET)}
                  />
                </div>
              </div>
            </div>
          )}

          {platform && (
            <PlatformConnectView
              platform={platform}
              onBack={handleBack}
              onConnect={handleOAuthConnect}
              isConnecting={isConnecting}
              facebookPagePicker={facebookPagePickerForView}
              onFacebookPageConnected={resetToList}
            />
          )}

          {step === 'custom-rtmp' && (
            <CustomRTMPForm
              preset={rtmpPreset}
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
