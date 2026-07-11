import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, Video } from 'lucide-react'
import { toast } from 'sonner'
import { createSession } from '@/api/sessions'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveStudioContext } from '@/lib/studioContext'
import { generatePeerId } from '@/lib/utils'
import type { LayoutType } from '@/types/session'

export function HomePage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [layout, setLayout] = useState<LayoutType>('CONTAIN')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) {
      toast.error('Enter your display name')
      return
    }

    setLoading(true)
    try {
      const session = await createSession({
        host_display_name: name,
        layout,
      })

      const peerId = generatePeerId()
      saveStudioContext({
        sessionId: session.session_id,
        roomId: session.room_id,
        mediasoupWsUrl: session.mediasoup_ws_url,
        layout: session.layout,
        hostDisplayName: session.host_display_name,
        inviteUrl: session.invite_url,
        isHost: true,
        displayName: name,
        peerId,
      })

      toast.success('Session created')
      navigate(`/studio/${session.session_id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-grid-bg min-h-[calc(100dvh-3.5rem)]">
      <div className="mx-auto flex max-w-lg flex-col justify-center px-4 py-12 sm:py-20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Video className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Start a live session</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Create a studio room, invite guests, and go live with recording and streaming.
          </p>
        </div>

        <Card className="glass-panel border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Host studio
            </CardTitle>
            <CardDescription>You'll get an invite link to share with guests.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="layout">Default layout</Label>
                <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)} disabled={loading}>
                  <SelectTrigger id="layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTAIN">Contain</SelectItem>
                    <SelectItem value="THUMBNAIL">Thumbnail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create session'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
