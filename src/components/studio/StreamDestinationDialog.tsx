import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StreamDestinationInput } from '@/api/streaming'
import type { PersistedDestination } from '@/types/persistence'

const RTMP_PLATFORM_PRESETS = [
  { label: 'Twitch', placeholder: 'rtmp://live.twitch.tv/app/<stream-key>' },
  { label: 'YouTube', placeholder: 'rtmp://a.rtmp.youtube.com/live2/<stream-key>' },
  { label: 'Facebook', placeholder: 'rtmps://live-api-s.facebook.com:443/rtmp/<stream-key>' },
  { label: 'TikTok', placeholder: 'rtmp://push.tiktok.com/live/<stream-key>' },
  { label: 'Custom', placeholder: 'rtmp://live.example.com/app/stream-key' },
] as const

interface StreamDestinationDraft {
  id: string
  label: string
  url: string
  destinationId?: string
}

export interface StreamDestinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartStream: (type: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) => void
  savedDestinations?: PersistedDestination[]
  trigger?: React.ReactNode
}

function createDestinationDraft(
  label = 'Custom',
  url = '',
  destinationId?: string,
): StreamDestinationDraft {
  return { id: crypto.randomUUID(), label, url, destinationId }
}

function draftsFromSaved(savedDestinations: PersistedDestination[]): StreamDestinationDraft[] {
  if (savedDestinations.length === 0) {
    return [createDestinationDraft('Twitch')]
  }
  return savedDestinations.map((destination) =>
    createDestinationDraft(
      destination.label || 'Custom',
      destination.url,
      destination.destination_id,
    ),
  )
}

export function StreamDestinationDialog({
  open,
  onOpenChange,
  onStartStream,
  savedDestinations = [],
  trigger,
}: StreamDestinationDialogProps) {
  const [streamType, setStreamType] = useState<'RTMP' | 'HLS'>('RTMP')
  const [destinations, setDestinations] = useState<StreamDestinationDraft[]>(() =>
    draftsFromSaved(savedDestinations),
  )

  useEffect(() => {
    if (open) {
      setDestinations(draftsFromSaved(savedDestinations))
    }
  }, [open, savedDestinations])

  const validDestinations = destinations.filter((item) => item.url.trim())

  const handleAddDestination = () => {
    setDestinations((current) => [...current, createDestinationDraft()])
  }

  const handleRemoveDestination = (id: string) => {
    setDestinations((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    )
  }

  const handleDestinationChange = (
    id: string,
    patch: Partial<Pick<StreamDestinationDraft, 'label' | 'url'>>,
  ) => {
    setDestinations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const handleStartStream = () => {
    if (streamType === 'HLS') {
      onStartStream('HLS')
    } else {
      onStartStream(
        'RTMP',
        validDestinations.map((item) => ({
          url: item.url.trim(),
          label: item.label.trim() || 'Custom',
        })),
      )
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start streaming</DialogTitle>
          <DialogDescription>
            Send compositor output to one or more RTMP destinations, or generate HLS locally.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Protocol</Label>
            <Select value={streamType} onValueChange={(v) => setStreamType(v as 'RTMP' | 'HLS')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RTMP">RTMP (multi-destination)</SelectItem>
                <SelectItem value="HLS">HLS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {streamType === 'RTMP' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Destinations</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddDestination}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {destinations.map((destination, index) => {
                const preset =
                  RTMP_PLATFORM_PRESETS.find((item) => item.label === destination.label) ??
                  RTMP_PLATFORM_PRESETS[RTMP_PLATFORM_PRESETS.length - 1]

                return (
                  <div
                    key={destination.id}
                    className="space-y-2 rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Destination {index + 1}
                      </Label>
                      {destinations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveDestination(destination.id)}
                          aria-label="Remove destination"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <Select
                      value={destination.label}
                      onValueChange={(value) => handleDestinationChange(destination.id, { label: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RTMP_PLATFORM_PRESETS.map((item) => (
                          <SelectItem key={item.label} value={item.label}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder={preset.placeholder}
                      value={destination.url}
                      onChange={(e) =>
                        handleDestinationChange(destination.id, { url: e.target.value })
                      }
                    />
                  </div>
                )
              })}

              <p className="text-xs text-muted-foreground">
                Stream simultaneously to Twitch, YouTube, Facebook, TikTok, or any custom RTMP
                endpoint. Each destination gets its own encoded output branch.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="live"
            onClick={handleStartStream}
            disabled={streamType === 'RTMP' && validDestinations.length === 0}
          >
            Start stream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
