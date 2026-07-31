import { useState } from 'react'
import {
  Circle,
  Loader2,
  Radio,
  Square,
  StopCircle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConnectionBanner } from '@/components/studio/ConnectionBanner'
import { StreamDestinationDialog } from '@/components/studio/StreamDestinationDialog'
import type { StreamDestinationInput } from '@/api/streaming'
import { streamDestinationModalEnabled } from '@/lib/featureFlags'
import type { ConnectionState } from '@/types/session'
import type { OutputState } from '@/types/studio'
import { cn } from '@/lib/utils'

interface TopToolbarProps {
  title: string
  subtitle?: string
  connectionState: ConnectionState
  connectionError?: string | null
  isHost: boolean
  recordingState: OutputState
  streamingState: OutputState
  onStartRecording: () => void
  onStopRecording: () => void
  onStartStream: (type: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) => void
  onStopStream: () => void
  onEndSession?: () => void
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

function GoLiveButton({
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
      {streamingState === 'starting' ? 'Starting…' : 'Go live'}
    </Button>
  )
}

export function TopToolbar({
  title,
  subtitle,
  connectionState,
  connectionError,
  isHost,
  recordingState,
  streamingState,
  onStartRecording,
  onStopRecording,
  onStartStream,
  onStopStream,
  onEndSession,
}: TopToolbarProps) {
  const [streamOpen, setStreamOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const handleDirectGoLive = () => {
    onStartStream('RTMP')
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/40 px-4 py-3">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <ConnectionBanner state={connectionState} error={connectionError} />

        {isHost && (
          <>
            <OutputButton
              state={recordingState}
              idleLabel="Record"
              activeLabel="Stop"
              idleIcon={Circle}
              activeIcon={Square}
              onStart={onStartRecording}
              onStop={onStopRecording}
            />

            {streamingState === 'active' || streamingState === 'stopping' ? (
              <OutputButton
                state={streamingState}
                idleLabel="Go live"
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
                trigger={<GoLiveButton streamingState={streamingState} />}
              />
            ) : (
              <GoLiveButton streamingState={streamingState} onClick={handleDirectGoLive} />
            )}

            {onEndSession && (
              <Dialog open={endOpen} onOpenChange={setEndOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>End session?</DialogTitle>
                    <DialogDescription>This disconnects all participants and stops recording and streaming.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEndOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => { onEndSession(); setEndOpen(false) }}>End session</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </header>
  )
}
