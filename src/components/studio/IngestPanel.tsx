import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { getIngestStatus } from '@/api/sessions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { IngestStatus } from '@/types/session'

interface IngestPanelProps {
  sessionId: string
  enabled?: boolean
}

export function IngestPanel({ sessionId, enabled = true }: IngestPanelProps) {
  const [ingest, setIngest] = useState<IngestStatus | null>(null)

  useEffect(() => {
    if (!enabled || !sessionId) return

    let cancelled = false

    const poll = async () => {
      try {
        const data = await getIngestStatus(sessionId)
        if (!cancelled) setIngest(data)
      } catch {
        // ingest debug endpoint may be unavailable in some environments
      }
    }

    void poll()
    const id = window.setInterval(poll, 5000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [enabled, sessionId])

  if (!ingest) return null

  return (
    <Card className="glass-panel border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 text-primary" />
          Compositor ingest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          <Badge variant={ingest.joined ? 'success' : 'outline'}>
            {ingest.joined ? 'Joined' : 'Not joined'}
          </Badge>
          {ingest.recording_active && <Badge variant="live">Recording</Badge>}
          {ingest.streaming_active && <Badge variant="live">Streaming</Badge>}
        </div>
        <p>Frames: {ingest.composited_frames.toLocaleString()}</p>
        <p>
          Canvas: {ingest.canvas_width}×{ingest.canvas_height} · Layout: {ingest.layout}
        </p>
        <p>Participants on ingest: {ingest.participants.length}</p>
      </CardContent>
    </Card>
  )
}
