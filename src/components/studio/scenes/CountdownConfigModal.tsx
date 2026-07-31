import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Scene } from '@/types/scenes'

const COUNTDOWN_DURATIONS = [
  { value: 10, label: '10 seconds' },
  { value: 15, label: '15 seconds' },
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
]

interface CountdownConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cameraScenes: Scene[]
  onSave: (durationSeconds: number, targetSceneId: string) => void
  isSaving?: boolean
}

export function CountdownConfigModal({
  open,
  onOpenChange,
  cameraScenes,
  onSave,
  isSaving,
}: CountdownConfigModalProps) {
  const [duration, setDuration] = useState(String(COUNTDOWN_DURATIONS[2].value))
  const [targetSceneId, setTargetSceneId] = useState('')

  useEffect(() => {
    if (!open) return
    setDuration(String(COUNTDOWN_DURATIONS[2].value))
    setTargetSceneId(cameraScenes[0]?.scene_id ?? '')
  }, [open, cameraScenes])

  const handleSave = () => {
    const durationSeconds = Number(duration)
    if (!targetSceneId || !durationSeconds) return
    onSave(durationSeconds, targetSceneId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Countdown scene</DialogTitle>
          <DialogDescription>
            When activated, a timer runs and then switches to the target scene.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Duration
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {COUNTDOWN_DURATIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Switch to scene when timer ends
            </Label>
            <Select value={targetSceneId} onValueChange={setTargetSceneId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target scene" />
              </SelectTrigger>
              <SelectContent>
                {cameraScenes.map((scene) => (
                  <SelectItem key={scene.scene_id} value={scene.scene_id}>
                    {scene.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !targetSceneId || cameraScenes.length === 0}
          >
            Save countdown scene
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
