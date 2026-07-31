import { useState } from 'react'
import {
  Circle,
  LayoutGrid,
  Plus,
  Radio,
  Square,
  StopCircle,
  Trash2,
  X,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { InvitePanel } from '@/components/studio/InvitePanel'
import type { StreamDestinationInput } from '@/api/streaming'
import type { LayoutType } from '@/types/session'

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
}

interface HostToolbarProps {
  layout: LayoutType
  inviteUrl?: string
  loading?: boolean
  activeRecording: boolean
  activeStream: boolean
  onLayoutChange: (layout: LayoutType) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onStartStream: (type: 'RTMP' | 'HLS', destinations?: StreamDestinationInput[]) => void
  onStopStream: () => void
  onEndSession: () => void
}

function createDestinationDraft(label = 'Custom'): StreamDestinationDraft {
  return {
    id: crypto.randomUUID(),
    label,
    url: '',
  }
}

export function HostToolbar({
  layout,
  inviteUrl,
  loading,
  activeRecording,
  activeStream,
  onLayoutChange,
  onStartRecording,
  onStopRecording,
  onStartStream,
  onStopStream,
  onEndSession,
}: HostToolbarProps) {
  const [streamType, setStreamType] = useState<'RTMP' | 'HLS'>('RTMP')
  const [destinations, setDestinations] = useState<StreamDestinationDraft[]>([
    createDestinationDraft('Twitch'),
  ])
  const [streamOpen, setStreamOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

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

  const handlePresetChange = (id: string, label: string) => {
    handleDestinationChange(id, { label })
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
    setStreamOpen(false)
  }

  const handleEndSession = () => {
    onEndSession()
    setEndOpen(false)
  }

  return (
    <aside className="glass-panel w-full space-y-4 rounded-2xl p-4 lg:w-80 lg:shrink-0">
      <div>
        <h2 className="text-sm font-semibold">Host controls</h2>
        <p className="text-xs text-muted-foreground">Manage layout, output, and session</p>
      </div>

      {inviteUrl && <InvitePanel inviteUrl={inviteUrl} />}

      <Separator />

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <LayoutGrid className="h-3.5 w-3.5" />
          Compositor layout
        </Label>
        <Select value={layout} onValueChange={(v) => onLayoutChange(v as LayoutType)} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CONTAIN">Contain — dynamic grid</SelectItem>
            <SelectItem value="COVER">Cover — grid, fill tiles</SelectItem>
            <SelectItem value="GRID">Grid — fixed 2×2 / 3×3</SelectItem>
            <SelectItem value="SIDE_BY_SIDE">Side by side — 50/50</SelectItem>
            <SelectItem value="HALFSCREEN">Half screen — 50/50</SelectItem>
            <SelectItem value="SPOTLIGHT">Spotlight — host + side strip</SelectItem>
            <SelectItem value="THUMBNAIL">Thumbnail — host + bottom strip</SelectItem>
            <SelectItem value="CINEMA">Cinema — host + filmstrip</SelectItem>
            <SelectItem value="PICTURE_IN_PICTURE">Picture in picture</SelectItem>
            <SelectItem value="OVERLAY">Overlay — floating PiP</SelectItem>
            <SelectItem value="FULLSCREEN">Fullscreen — host only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Affects server-side recording and streaming output, not the browser grid.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Recording</Label>
        {activeRecording ? (
          <Button variant="destructive" className="w-full" disabled={loading} onClick={onStopRecording}>
            <Square className="mr-2 h-4 w-4 fill-current" />
            Stop recording
          </Button>
        ) : (
          <Button variant="secondary" className="w-full" disabled={loading} onClick={onStartRecording}>
            <Circle className="mr-2 h-4 w-4 fill-live text-live" />
            Start recording
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Streaming</Label>
        {activeStream ? (
          <Button variant="destructive" className="w-full" disabled={loading} onClick={onStopStream}>
            <StopCircle className="mr-2 h-4 w-4" />
            Stop stream
          </Button>
        ) : (
          <Dialog open={streamOpen} onOpenChange={setStreamOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full" disabled={loading}>
                <Radio className="mr-2 h-4 w-4" />
                Go live
              </Button>
            </DialogTrigger>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddDestination}
                      >
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
                            onValueChange={(value) => handlePresetChange(destination.id, value)}
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
                      Stream simultaneously to Twitch, YouTube, Facebook, TikTok, or any custom
                      RTMP endpoint. Each destination gets its own encoded output branch.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStreamOpen(false)}>
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
        )}
      </div>

      <Separator />

      <Dialog open={endOpen} onOpenChange={setEndOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" />
            End session
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
            <Button variant="destructive" onClick={handleEndSession}>
              End session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
