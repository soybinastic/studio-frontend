import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { validateInvite } from '@/api/sessions'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveStudioContext } from '@/lib/studioContext'
import { generatePeerId } from '@/lib/utils'

export function JoinPage() {
  const { sessionId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [hostName, setHostName] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    if (!sessionId || !token) {
      toast.error('Invalid invite link')
      return
    }

    setValidating(true)
    try {
      const result = await validateInvite(sessionId, token)
      if (!result.valid) {
        toast.error('Invite link is not valid')
        return
      }
      setHostName(result.host_display_name)
      setValidated(true)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not validate invite')
    } finally {
      setValidating(false)
    }
  }

  useEffect(() => {
    if (token && sessionId && !validated && !validating) {
      void handleValidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate once when invite link loads
  }, [sessionId, token])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) {
      toast.error('Enter your display name')
      return
    }
    if (!sessionId || !token) return

    setLoading(true)
    try {
      const result = await validateInvite(sessionId, token)
      if (!result.valid) {
        toast.error('Invite link expired or invalid')
        return
      }

      const peerId = generatePeerId()
      saveStudioContext({
        sessionId: result.session_id,
        roomId: result.room_id,
        mediasoupWsUrl: result.mediasoup_ws_url,
        layout: result.layout,
        hostDisplayName: result.host_display_name,
        isHost: false,
        displayName: name,
        peerId,
      })

      navigate(`/studio/${result.session_id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to join session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="studio-grid-bg min-h-[calc(100dvh-3.5rem)]">
      <div className="mx-auto flex max-w-lg flex-col justify-center px-4 py-12 sm:py-20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Join studio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {hostName ? `Invited by ${hostName}` : 'Enter your name to join the live session.'}
          </p>
        </div>

        <Card className="glass-panel border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Guest access</CardTitle>
            <CardDescription>
              Camera and microphone access will be requested when you enter the studio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!validated ? (
              <Button className="w-full" size="lg" onClick={handleValidate} disabled={validating || !token}>
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating…
                  </>
                ) : (
                  'Validate invite'
                )}
              </Button>
            ) : (
              <form onSubmit={handleJoin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Display name</Label>
                  <Input
                    id="guest-name"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    'Enter studio'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
