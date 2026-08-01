import { useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { StudioOutputControls, type StudioOutputControlsProps } from '@/components/studio/toolbar/StudioOutputControls'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { ConnectionState } from '@/types/session'
import { cn } from '@/lib/utils'

export interface StudioHeaderControlsProps {
  connectionState: ConnectionState
  connectionError?: string | null
  output?: StudioOutputControlsProps
  onEndSession?: () => void
}

export function StudioHeaderControls({
  connectionState,
  connectionError,
  output,
  onEndSession,
}: StudioHeaderControlsProps) {
  const [endOpen, setEndOpen] = useState(false)
  const breakpoint = useBreakpoint()
  const compact = breakpoint === 'mobile' || breakpoint === 'tablet'

  return (
    <div className={cn('flex shrink-0 items-center gap-1 sm:gap-2', compact && 'flex-nowrap')}>
      <ConnectionBanner state={connectionState} error={connectionError} compact={compact} />

      {output && <StudioOutputControls {...output} compact={compact} />}

      {onEndSession && (
        <Dialog open={endOpen} onOpenChange={setEndOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="touch-target h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive sm:h-8 sm:w-8"
              aria-label="End session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End session?</DialogTitle>
              <DialogDescription>
                This disconnects all participants and stops recording and streaming.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEndOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onEndSession()
                  setEndOpen(false)
                }}
              >
                End session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
