import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getSession } from '@/api/sessions'
import { ApiError } from '@/api/client'
import { ConnectionBanner } from '@/components/studio/ConnectionBanner'
import { HostToolbar } from '@/components/studio/HostToolbar'
import { IngestPanel } from '@/components/studio/IngestPanel'
import { MediaControls } from '@/components/studio/MediaControls'
import { ParticipantGrid } from '@/components/studio/ParticipantGrid'
import { useHostControls } from '@/hooks/useHostControls'
import { useRoom } from '@/hooks/useRoom'
import { clearStudioContext, loadStudioContext } from '@/lib/studioContext'
import type { StudioSessionContext } from '@/types/session'

export function StudioPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [context, setContext] = useState<StudioSessionContext | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const stored = loadStudioContext(sessionId)
      if (stored) {
        if (!cancelled) {
          setContext(stored)
          setBootstrapping(false)
        }
        return
      }

      try {
        const session = await getSession(sessionId)
        if (session.status === 'ENDED') {
          toast.error('This session has ended')
          navigate('/')
          return
        }
        if (!cancelled) {
          toast.error('Session context missing — open from home or invite link')
          navigate('/')
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : 'Session not found')
          navigate('/')
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [sessionId, navigate])

  const roomEnabled = Boolean(context && !bootstrapping)

  const {
    connectionState,
    participants,
    error,
    micEnabled,
    webcamEnabled,
    toggleMic,
    toggleWebcam,
    leave,
  } = useRoom({
    roomId: context?.roomId ?? '',
    peerId: context?.peerId ?? '',
    displayName: context?.displayName ?? '',
    mediasoupWsUrl: context?.mediasoupWsUrl ?? '',
    enabled: roomEnabled,
  })

  const hostControls = useHostControls(sessionId, Boolean(context?.isHost))

  const handleLeave = () => {
    leave()
    clearStudioContext()
    navigate(context?.isHost ? '/' : '/')
  }

  const handleEndSession = async () => {
    const ok = await hostControls.handleEndSession()
    if (ok) {
      leave()
      clearStudioContext()
      navigate('/')
    }
  }

  const title = useMemo(() => {
    if (!context) return 'Studio'
    return context.isHost ? 'Host studio' : `${context.hostDisplayName}'s studio`
  }, [context])

  if (bootstrapping || !context) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="studio-grid-bg min-h-[calc(100dvh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {participants.length} participant{participants.length === 1 ? '' : 's'} ·{' '}
              {context.layout} layout
            </p>
          </div>
          <ConnectionBanner state={connectionState} error={error} />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <section className="min-w-0 flex-1 space-y-4">
            <div className="glass-panel min-h-[40dvh] rounded-2xl p-3 sm:p-4 lg:min-h-[55dvh]">
              {participants.length > 0 ? (
                <ParticipantGrid participants={participants} />
              ) : (
                <div className="flex h-full min-h-[30dvh] items-center justify-center text-sm text-muted-foreground">
                  Waiting for media…
                </div>
              )}
            </div>

            <MediaControls
              micEnabled={micEnabled}
              webcamEnabled={webcamEnabled}
              onToggleMic={() => void toggleMic()}
              onToggleWebcam={() => void toggleWebcam()}
              onLeave={handleLeave}
              leaveLabel={context.isHost ? 'Leave studio' : 'Leave'}
            />
          </section>

          {context.isHost && (
            <div className="space-y-4">
              <HostToolbar
                layout={hostControls.layout}
                inviteUrl={context.inviteUrl}
                loading={hostControls.loading}
                activeRecording={Boolean(hostControls.activeRecording)}
                activeStream={Boolean(hostControls.activeStream)}
                onLayoutChange={(l) => void hostControls.handleLayoutChange(l)}
                onStartRecording={() => void hostControls.handleStartRecording()}
                onStopRecording={() => void hostControls.handleStopRecording()}
                onStartStream={(t, u) => void hostControls.handleStartStream(t, u)}
                onStopStream={() => void hostControls.handleStopStream()}
                onEndSession={() => void handleEndSession()}
              />
              <IngestPanel sessionId={sessionId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
