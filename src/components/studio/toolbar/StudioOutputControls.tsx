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
import type { PersistedDestination } from '@/types/persistence'
import type { OutputState } from '@/types/studio'
import { cn } from '@/lib/utils'

export interface StudioOutputControlsProps {
  recordingState: OutputState
  streamingState: OutputState
  savedDestinations?: PersistedDestination[]
  onStartRecording: () => void
  onStopRecording: () => void
  onStartStream: (type: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) => void
  onStopStream: () => void
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
}: {
  state: OutputState
  activeLabel: string
  idleLabel: string
  activeIcon: typeof Square
  idleIcon: typeof Circle
  onStart: () => void
  onStop: () => void
  variant?: 'secondary' | 'live'
}) {
  const isLoading = state === 'starting' || state === 'stopping'
  const isActive = state === 'active'
  const isStopping = state === 'stopping'
  const isDisabled = state === 'disabled'

  if (isActive || isStopping) {
    return (
      <Button variant="destructive" size="sm" disabled={isLoading} onClick={onStop}>
        {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ActiveIcon className="mr-1.5 h-3.5 w-3.5 fill-current" />}
        {isStopping ? 'Stopping…' : activeLabel}
      </Button>
    )
  }

  return (
    <Button variant={variant} size="sm" disabled={isLoading || isDisabled} onClick={onStart}>
      {isLoading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <IdleIcon className={cn('mr-1.5 h-3.5 w-3.5', variant === 'live' && 'fill-live text-live')} />
      )}
      {state === 'starting' ? 'Starting…' : idleLabel}
    </Button>
  )
}

function StartStreamButton({
  streamingState,
  onClick,
}: {
  streamingState: OutputState
  onClick?: () => void
}) {
  return (
    <Button
      variant="live"
      size="sm"
      disabled={streamingState === 'starting' || streamingState === 'disabled'}
      onClick={onClick}
    >
      {streamingState === 'starting' ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Radio className="mr-1.5 h-3.5 w-3.5" />
      )}
      {streamingState === 'starting' ? 'Starting…' : 'Start stream'}
    </Button>
  )
}

export function StudioOutputControls({
  recordingState,
  streamingState,
  savedDestinations = [],
  onStartRecording,
  onStopRecording,
  onStartStream,
  onStopStream,
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
        />
      ) : streamDestinationModalEnabled ? (
        <StreamDestinationDialog
          open={streamOpen}
          onOpenChange={setStreamOpen}
          onStartStream={onStartStream}
          savedDestinations={savedDestinations}
          trigger={<StartStreamButton streamingState={streamingState} />}
        />
      ) : (
        <StartStreamButton streamingState={streamingState} onClick={handleDirectStartStream} />
      )}
    </>
  )
}
