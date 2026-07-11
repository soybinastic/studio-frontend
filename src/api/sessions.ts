import { apiRequest } from '@/api/client'
import type {
  InviteValidationResponse,
  LayoutType,
  Session,
  SessionCreateRequest,
  SessionCreateResponse,
} from '@/types/session'

export function createSession(body: SessionCreateRequest) {
  return apiRequest<SessionCreateResponse>('/sessions/', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSession(sessionId: string) {
  return apiRequest<Session>(`/sessions/${sessionId}/`)
}

export function endSession(sessionId: string) {
  return apiRequest<Session>(`/sessions/${sessionId}/`, {
    method: 'DELETE',
  })
}

export function updateLayout(sessionId: string, layout: LayoutType) {
  return apiRequest<Session>(`/sessions/${sessionId}/layout/`, {
    method: 'PATCH',
    body: JSON.stringify({ layout }),
  })
}

export function validateInvite(sessionId: string, inviteToken: string) {
  return apiRequest<InviteValidationResponse>(
    `/sessions/${sessionId}/validate-invite/`,
    {
      method: 'POST',
      body: JSON.stringify({ invite_token: inviteToken }),
    },
  )
}

export function getIngestStatus(sessionId: string) {
  return apiRequest<import('@/types/session').IngestStatus>(
    `/sessions/${sessionId}/ingest/`,
  )
}
