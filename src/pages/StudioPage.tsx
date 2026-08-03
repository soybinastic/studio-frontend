import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getSession } from '@/api/sessions'
import { ApiError } from '@/api/client'
import { StudioLayout } from '@/components/studio/StudioLayout'
import { useTenant } from '@/context/TenantProvider'
import {
  bootstrapEmbeddedStudioSession,
  shouldUseEmbeddedSessionBootstrap,
} from '@/lib/integration/embeddedSessionBootstrap'
import { loadStudioContext } from '@/lib/studioContext'
import type { StudioSessionContext } from '@/types/session'

export function StudioPage() {
  const { sessionId: urlSessionId = '' } = useParams()
  const navigate = useNavigate()
  const { isReady: tenantReady } = useTenant()
  const [context, setContext] = useState<StudioSessionContext | null>(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (shouldUseEmbeddedSessionBootstrap()) {
        try {
          const embeddedContext = await bootstrapEmbeddedStudioSession(urlSessionId)
          if (!cancelled) {
            setContext(embeddedContext)
          }
        } catch (err) {
          if (!cancelled) {
            toast.error(err instanceof ApiError ? err.message : 'Failed to start embedded studio session')
          }
        } finally {
          if (!cancelled) setBootstrapping(false)
        }
        return
      }

      const stored = loadStudioContext(urlSessionId)
      if (stored) {
        if (!cancelled) {
          setContext(stored)
          setBootstrapping(false)
        }
        return
      }

      try {
        const session = await getSession(urlSessionId)
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
  }, [urlSessionId, navigate])

  if (bootstrapping || !tenantReady || !context) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <StudioLayout context={context} sessionId={context.sessionId} />
}
