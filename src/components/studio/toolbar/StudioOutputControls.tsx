import { useState } from 'react'
import {
  Circle,
  Loader2,
  Radio,
  Square,
  StopCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StreamDestinationDialog } from '@/components/studio/StreamDestinationDialog'
import type { StreamDestinationInput } from '@/api/streaming'
import { streamDestinationModalEnabled } from '@/lib/featureFlags'
import type { PersistedDestination, PersistedPlatformConnection } from '@/types/persistence'
import type { OutputState } from '@/types/studio'
import { cn } from '@/lib/utils'

export interface StudioOutputControlsProps {
  recordingState: OutputState
  streamingState: OutputState
  savedDestinations?: PersistedDestination[]
  platformConnections?: PersistedPlatformConnection[]
  onStartRecording: () => void
  onStopRecording: () => void
  onStartStream: (type: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) => void
  onStopStream: () => void
  compact?: boolean
}

function OutputButton({
  state,
  activeLabel,
  idleLabel,
  activeIcon: ActiveIcon,
  idleIcon: IdleIcon,
  onStart,
  onStop,
  variant = 'secondary',
  compact = false,
}: {
  state: OutputState
  activeLabel: string
  idleLabel: string
  activeIcon: typeof Square
  idleIcon: typeof Circle
  onStart: () => void
  onStop: () => void
  variant?: 'secondary' | 'live'
  compact?: boolean
}) {
  const isLoading = state === 'starting' || state === 'stopping'
  const isActive = state === 'active'
  const isStopping = state === 'stopping'
  const isDisabled = state === 'disabled'

  if (isActive || isStopping) {
    return (
      <Button variant="destructive" size="sm" disabled={isLoading} onClick={onStop} className="shrink-0">
        {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ActiveIcon className={cn('h-3.5 w-3.5 fill-current', !compact && 'mr-1.5')} />}
        <span className={cn(compact && 'sr-only sm:not-sr-only')}>
          {isStopping ? (compact ? 'Stop' : 'Stopping…') : compact ? 'Stop' : activeLabel}
        </span>
      </Button>
    )
  }

  return (
    <Button variant={variant} size="sm" disabled={isLoading || isDisabled} onClick={onStart} className="shrink-0">
      {isLoading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <IdleIcon className={cn('h-3.5 w-3.5', variant === 'live' && 'fill-live text-live', !compact && 'mr-1.5')} />
      )}
      <span className={cn(compact && 'sr-only sm:not-sr-only')}>
        {state === 'starting' ? (compact ? '…' : 'Starting…') : compact ? (idleLabel.includes('record') ? 'Rec' : 'Stream') : idleLabel}
      </span>
    </Button>
  )
}

function StartStreamButton({
  streamingState,
  onClick,
  compact = false,
}: {
  streamingState: OutputState
  onClick?: () => void
  compact?: boolean
}) {
  return (
    <Button
      variant="live"
      size="sm"
      disabled={streamingState === 'starting' || streamingState === 'disabled'}
      onClick={onClick}
      className="shrink-0"
    >
      {streamingState === 'starting' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Radio className={cn('h-3.5 w-3.5', !compact && 'mr-1.5')} />
      )}
      <span className={cn(compact && 'sr-only sm:not-sr-only')}>
        {streamingState === 'starting' ? (compact ? '…' : 'Starting…') : compact ? 'Stream' : 'Start stream'}
      </span>
    </Button>
  )
}

export function StudioOutputControls({
  recordingState,
  streamingState,
  savedDestinations = [],
  platformConnections = [],
  onStartRecording,
  onStopRecording,
  onStartStream,
  onStopStream,
  compact = false,
}: StudioOutputControlsProps) {
  const [streamOpen, setStreamOpen] = useState(false)

  const handleDirectStartStream = () => {
    onStartStream('RTMP')
  }

  return (
    <>
      <OutputButton
        state={recordingState}
        idleLabel="Start record"
        activeLabel="Stop record"
        idleIcon={Circle}
        activeIcon={Square}
        onStart={onStartRecording}
        onStop={onStopRecording}
        compact={compact}
      />

      {streamingState === 'active' || streamingState === 'stopping' ? (
        <OutputButton
          state={streamingState}
          idleLabel="Start stream"
          activeLabel="Stop stream"
          idleIcon={Radio}
          activeIcon={StopCircle}
          onStart={() => {}}
          onStop={onStopStream}
          variant="live"
          compact={compact}
        />
      ) : streamDestinationModalEnabled ? (
        <StreamDestinationDialog
          open={streamOpen}
          onOpenChange={setStreamOpen}
          onStartStream={onStartStream}
          savedDestinations={savedDestinations}
          platformConnections={platformConnections}
          trigger={<StartStreamButton streamingState={streamingState} compact={compact} />}
        />
      ) : (
        <StartStreamButton streamingState={streamingState} onClick={handleDirectStartStream} compact={compact} />
      )}
    </>
  )
}
