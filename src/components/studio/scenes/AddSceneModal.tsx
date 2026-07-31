import { Camera, Timer } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AddSceneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChooseCamera: () => void
  onChooseCountdown: () => void
}

export function AddSceneModal({
  open,
  onOpenChange,
  onChooseCamera,
  onChooseCountdown,
}: AddSceneModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add scene</DialogTitle>
          <DialogDescription>Choose the type of scene to create.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-3"
            onClick={onChooseCamera}
          >
            <Camera className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-left">
              <div className="font-medium">Camera scene</div>
              <div className="text-xs text-muted-foreground">
                Layout, graphics, and devices
              </div>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-3"
            onClick={onChooseCountdown}
          >
            <Timer className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-left">
              <div className="font-medium">Countdown scene</div>
              <div className="text-xs text-muted-foreground">
                Timer that switches to another scene
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
