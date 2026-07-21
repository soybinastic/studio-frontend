import { useEffect, useMemo, useState } from 'react'
import { Link2, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  addRtmpSource,
  listRtmpSources,
  removeRtmpSource,
  type RtmpSource,
} from '@/api/rtmpSources'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RtmpIngestPanelProps {
  sessionId: string
  loading?: boolean
  activeStreamUrl?: string | null
  onChanged?: () => void
}

function toPreviewUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (trimmed.endsWith('.m3u8')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}

export function RtmpIngestPanel({
  sessionId,
  loading,
  activeStreamUrl,
  onChanged,
}: RtmpIngestPanelProps) {
  const [sources, setSources] = useState<RtmpSource[]>([])
  const [url, setUrl] = useState(activeStreamUrl ?? '')
  const [displayName, setDisplayName] = useState('Live output')
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    toPreviewUrl(activeStreamUrl ?? ''),
  )
  const [submitting, setSubmitting] = useState(false)

  const refresh = async () => {
    try {
      const data = await listRtmpSources(sessionId)
      setSources(data.filter((source) => source.status === 'ACTIVE'))
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 5000)
    return () => window.clearInterval(id)
  }, [sessionId])

  useEffect(() => {
    if (activeStreamUrl && !url) {
      setUrl(activeStreamUrl)
      setPreviewUrl(toPreviewUrl(activeStreamUrl))
    }
  }, [activeStreamUrl, url])

  const activePreview = useMemo(() => previewUrl ?? toPreviewUrl(url), [previewUrl, url])

  const handleAdd = async () => {
    if (!url.trim()) {
      toast.error('Enter an RTMP URL')
      return
    }

    setSubmitting(true)
    try {
      await addRtmpSource(sessionId, {
        url: url.trim(),
        display_name: displayName.trim() || 'RTMP source',
      })
      toast.success('RTMP source added to compositor')
      setPreviewUrl(toPreviewUrl(url))
      await refresh()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add RTMP source')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (sourceId: string) => {
    setSubmitting(true)
    try {
      await removeRtmpSource(sessionId, sourceId)
      toast.success('RTMP source removed')
      await refresh()
      onChanged?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove RTMP source')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="glass-panel border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-primary" />
          RTMP ingest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          Pull an RTMP stream into the compositor. Use your live destination URL to monitor
          output. Avoid ingesting the same URL you are actively publishing to from this session.
        </p>

        <div className="space-y-2">
          <Label htmlFor="rtmp-ingest-url">RTMP URL</Label>
          <Input
            id="rtmp-ingest-url"
            placeholder="rtmp://live.example.com/app/stream-key"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || submitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rtmp-ingest-name">Label</Label>
          <Input
            id="rtmp-ingest-name"
            placeholder="Live output"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading || submitting}
          />
        </div>

        <Button
          className="w-full"
          variant="secondary"
          disabled={loading || submitting || !url.trim()}
          onClick={() => void handleAdd()}
        >
          Add RTMP source
        </Button>

        {sources.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Active sources
            </Label>
            {sources.map((source) => (
              <div
                key={source.source_id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {source.display_name || source.source_id}
                  </p>
                  <p className="truncate text-muted-foreground">{source.url}</p>
                  <p className="text-muted-foreground">
                    decoded {source.video_buffers}/{source.audio_buffers}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={loading || submitting}
                  onClick={() => void handleRemove(source.source_id)}
                  aria-label="Remove RTMP source"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Play className="h-3.5 w-3.5" />
            Stream preview
          </Label>
          {activePreview ? (
            <video
              className="aspect-video w-full rounded-lg border border-border/60 bg-black"
              src={activePreview}
              controls
              playsInline
              autoPlay
              muted
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Browser preview works for HLS/HTTP URLs (.m3u8). Raw RTMP URLs are ingested on the
              server; check compositor ingest stats for buffer counts.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
