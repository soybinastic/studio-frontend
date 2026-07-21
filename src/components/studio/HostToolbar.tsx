import { useState } from 'react'
import {
  Circle,
  LayoutGrid,
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
import type { LayoutType } from '@/types/session'

interface HostToolbarProps {
  layout: LayoutType
  inviteUrl?: string
  loading?: boolean
  activeRecording: boolean
  activeStream: boolean
  onLayoutChange: (layout: LayoutType) => void
  onStartRecording: () => void
  onStopRecording: () => void
  onStartStream: (type: 'RTMP' | 'HLS', url?: string) => void
  onStopStream: () => void
  onEndSession: () => void
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
  const [streamUrl, setStreamUrl] = useState('')
  const [streamOpen, setStreamOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  const handleStartStream = () => {
    onStartStream(streamType, streamUrl || undefined)
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start streaming</DialogTitle>
                <DialogDescription>
                  Send compositor output to RTMP or generate HLS locally.
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
                      <SelectItem value="RTMP">RTMP</SelectItem>
                      <SelectItem value="HLS">HLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {streamType === 'RTMP' && (
                  <div className="space-y-2">
                    <Label htmlFor="rtmp-url">RTMP URL</Label>
                    <Input
                      id="rtmp-url"
                      placeholder="rtmp://live.example.com/app/stream-key"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStreamOpen(false)}>
                  Cancel
                </Button>
                <Button variant="live" onClick={handleStartStream} disabled={streamType === 'RTMP' && !streamUrl}>
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
