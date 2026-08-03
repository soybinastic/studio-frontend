import { createSession } from '@/api/sessions'
import { loadStudioContext, saveStudioContext } from '@/lib/studioContext'
import { generatePeerId } from '@/lib/utils'
import type { SessionCreateResponse, StudioSessionContext } from '@/types/session'
import { isEmbeddedIntegration } from '@/lib/integration/integrationMode'

const EMBED_ALIAS_PREFIX = 'studio-embed-alias:'

function embedAliasKey(embedSessionId: string): string {
  return `${EMBED_ALIAS_PREFIX}${embedSessionId}`
}

/** Maps CMS iframe session id → compositor session id (stable across iframe reloads). */
export function resolveEmbeddedCompositorSessionId(embedSessionId: string): string {
  if (typeof sessionStorage === 'undefined') return embedSessionId
  return sessionStorage.getItem(embedAliasKey(embedSessionId)) ?? embedSessionId
}

function saveEmbeddedSessionAlias(embedSessionId: string, compositorSessionId: string): void {
  if (embedSessionId === compositorSessionId) return
  sessionStorage.setItem(embedAliasKey(embedSessionId), compositorSessionId)
}

function getHostDisplayNameFromQuery(): string {
  const name = new URLSearchParams(window.location.search).get('host_display_name')?.trim()
  return name || 'Host'
}

function buildStudioContext(
  session: SessionCreateResponse,
  displayName: string,
  peerId: string,
): StudioSessionContext {
  return {
    sessionId: session.session_id,
    roomId: session.room_id,
    mediasoupWsUrl: session.mediasoup_ws_url,
    layout: session.layout,
    hostDisplayName: session.host_display_name,
    inviteUrl: session.invite_url,
    isHost: true,
    displayName,
    peerId,
  }
}

/**
 * Bootstraps a compositor session when studio-frontend is embedded in CMS.
 *
 * CMS supplies a placeholder session id in the iframe URL; compositor assigns
 * the real session on create. An alias preserves the mapping across reloads.
 */
export async function bootstrapEmbeddedStudioSession(
  embedSessionId: string,
): Promise<StudioSessionContext> {
  const compositorSessionId = resolveEmbeddedCompositorSessionId(embedSessionId)

  const stored = loadStudioContext(compositorSessionId)
  if (stored) {
    return stored
  }

  const displayName = getHostDisplayNameFromQuery()
  const session = await createSession({
    host_display_name: displayName,
  })

  const peerId = generatePeerId()
  const context = buildStudioContext(session, displayName, peerId)
  saveStudioContext(context)
  saveEmbeddedSessionAlias(embedSessionId, session.session_id)

  return context
}

export function shouldUseEmbeddedSessionBootstrap(): boolean {
  return isEmbeddedIntegration()
}
