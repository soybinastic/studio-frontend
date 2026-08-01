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
import type { ConnectionState } from '@/types/session'

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

  return (
    <>
      <ConnectionBanner state={connectionState} error={connectionError} />

      {output && <StudioOutputControls {...output} />}

      {onEndSession && (
        <Dialog open={endOpen} onOpenChange={setEndOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
    </>
  )
}
