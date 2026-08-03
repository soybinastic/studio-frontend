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
import { Badge } from '@/components/ui/badge'
import { PlatformIcon, getPlatformLabel } from '@/components/destinations/PlatformIcon'
import type { StreamDestinationInput } from '@/api/streaming'
import type { PersistedDestination, PersistedPlatformConnection } from '@/types/persistence'
import {
  getConnectionForDestination,
  getGoLiveDestinationOptions,
  goLiveOptionsToStreamInputs,
  maskRtmpUrl,
  type GoLiveDestinationOption,
} from '@/lib/streamDestinations'
import { cn } from '@/lib/utils'

import { GO_LIVE_MANUAL_RTMP_PRESETS } from '@/constants/rtmpPlatforms'

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
  platformConnections?: PersistedPlatformConnection[]
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
      destination.label || destination.platform || 'Custom',
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
  platformConnections = [],
  trigger,
}: StreamDestinationDialogProps) {
  const [streamType, setStreamType] = useState<'RTMP' | 'HLS'>('RTMP')
  const goLiveOptions = getGoLiveDestinationOptions(savedDestinations, platformConnections)
  const hasGoLiveDestinations = goLiveOptions.length > 0

  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(
    () => new Set(goLiveOptions.map((option) => option.id)),
  )
  const [manualDestinations, setManualDestinations] = useState<StreamDestinationDraft[]>([])
  const [legacyDestinations, setLegacyDestinations] = useState<StreamDestinationDraft[]>(() =>
    draftsFromSaved(savedDestinations),
  )

  useEffect(() => {
    if (!open) return
    const nextOptions = getGoLiveDestinationOptions(savedDestinations, platformConnections)
    setSelectedOptionIds(new Set(nextOptions.map((option) => option.id)))
    setManualDestinations([])
    setLegacyDestinations(draftsFromSaved(savedDestinations))
  }, [open, savedDestinations, platformConnections])

  const selectedOptions = goLiveOptions.filter((option) => selectedOptionIds.has(option.id))
  const validManualDestinations = manualDestinations.filter((item) => item.url.trim())
  const validLegacyDestinations = legacyDestinations.filter((item) => item.url.trim())

  const resolvedDestinations = hasGoLiveDestinations
    ? [
        ...goLiveOptionsToStreamInputs(selectedOptions),
        ...validManualDestinations.map((item) => ({
          url: item.url.trim(),
          label: item.label.trim() || 'Custom',
        })),
      ]
    : validLegacyDestinations.map((item) => ({
        url: item.url.trim(),
        label: item.label.trim() || 'Custom',
      }))

  const toggleGoLiveOption = (optionId: string) => {
    setSelectedOptionIds((current) => {
      const next = new Set(current)
      if (next.has(optionId)) {
        next.delete(optionId)
      } else {
        next.add(optionId)
      }
      return next
    })
  }

  const renderGoLiveOption = (option: GoLiveDestinationOption) => {
    const isSelected = selectedOptionIds.has(option.id)
    const connection =
      option.kind === 'saved' && option.destination
        ? getConnectionForDestination(option.destination.destination_id, platformConnections)
        : option.connection

    return (
      <label
        key={option.id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
          isSelected
            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border/60 hover:border-primary/30',
        )}
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-primary"
          checked={isSelected}
          onChange={() => toggleGoLiveOption(option.id)}
        />
        <PlatformIcon platform={option.platform} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{option.label}</p>
            <Badge variant="secondary" className="text-[10px]">
              {getPlatformLabel(option.platform)}
            </Badge>
            {option.kind === 'pending_youtube' && (
              <Badge variant="outline" className="text-[10px]">
                Ready on go live
              </Badge>
            )}
            {connection?.status === 'streaming' && <Badge variant="live">Streaming</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {option.kind === 'pending_youtube'
              ? 'YouTube stream key will be created when you start streaming'
              : option.destination
                ? maskRtmpUrl(option.destination.url)
                : ''}
          </p>
        </div>
      </label>
    )
  }

  const handleAddManualDestination = () => {
    setManualDestinations((current) => [...current, createDestinationDraft()])
  }

  const handleRemoveManualDestination = (id: string) => {
    setManualDestinations((current) => current.filter((item) => item.id !== id))
  }

  const handleManualDestinationChange = (
    id: string,
    patch: Partial<Pick<StreamDestinationDraft, 'label' | 'url'>>,
  ) => {
    setManualDestinations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const handleLegacyDestinationChange = (
    id: string,
    patch: Partial<Pick<StreamDestinationDraft, 'label' | 'url'>>,
  ) => {
    setLegacyDestinations((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const handleAddLegacyDestination = () => {
    setLegacyDestinations((current) => [...current, createDestinationDraft()])
  }

  const handleRemoveLegacyDestination = (id: string) => {
    setLegacyDestinations((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    )
  }

  const handleStartStream = () => {
    if (streamType === 'HLS') {
      onStartStream('HLS')
    } else {
      onStartStream('RTMP', resolvedDestinations)
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
            Send compositor output to your connected destinations or add a one-time RTMP target.
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

          {streamType === 'RTMP' && hasGoLiveDestinations && (
            <div className="space-y-3">
              <Label>Connected destinations</Label>
              <div className="space-y-2">{goLiveOptions.map(renderGoLiveOption)}</div>

              <div className="flex items-center justify-between">
                <Label>Add one-time destination</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddManualDestination}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {manualDestinations.map((destination, index) => {
                const preset =
                  GO_LIVE_MANUAL_RTMP_PRESETS.find((item) => item.label === destination.label) ??
                  GO_LIVE_MANUAL_RTMP_PRESETS[GO_LIVE_MANUAL_RTMP_PRESETS.length - 1]

                return (
                  <div
                    key={destination.id}
                    className="space-y-2 rounded-lg border border-dashed border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">One-time {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveManualDestination(destination.id)}
                        aria-label="Remove destination"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Select
                      value={destination.label}
                      onValueChange={(value) =>
                        handleManualDestinationChange(destination.id, { label: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GO_LIVE_MANUAL_RTMP_PRESETS.map((item) => (
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
                        handleManualDestinationChange(destination.id, { url: e.target.value })
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}

          {streamType === 'RTMP' && !hasGoLiveDestinations && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Destinations</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLegacyDestination}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {legacyDestinations.map((destination, index) => {
                const preset =
                  GO_LIVE_MANUAL_RTMP_PRESETS.find((item) => item.label === destination.label) ??
                  GO_LIVE_MANUAL_RTMP_PRESETS[GO_LIVE_MANUAL_RTMP_PRESETS.length - 1]

                return (
                  <div
                    key={destination.id}
                    className="space-y-2 rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs text-muted-foreground">Destination {index + 1}</Label>
                      {legacyDestinations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveLegacyDestination(destination.id)}
                          aria-label="Remove destination"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <Select
                      value={destination.label}
                      onValueChange={(value) =>
                        handleLegacyDestinationChange(destination.id, { label: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GO_LIVE_MANUAL_RTMP_PRESETS.map((item) => (
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
                        handleLegacyDestinationChange(destination.id, { url: e.target.value })
                      }
                    />
                  </div>
                )
              })}

              <p className="text-xs text-muted-foreground">
                Connect destinations from the header menu to reuse Twitch, YouTube, or custom RTMP
                targets without re-entering stream keys.
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
            disabled={streamType === 'RTMP' && resolvedDestinations.length === 0}
          >
            Start stream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
