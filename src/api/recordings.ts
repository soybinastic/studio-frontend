import { apiRequest } from '@/api/client'
import type { Recording } from '@/types/session'

export function listRecordings(sessionId: string) {
  return apiRequest<Recording[]>(`/sessions/${sessionId}/recordings/`)
}

export function startRecording(sessionId: string) {
  return apiRequest<Recording>(`/sessions/${sessionId}/recordings/start/`, {
    method: 'POST',
  })
}

export function stopRecording(sessionId: string) {
  return apiRequest<Recording>(`/sessions/${sessionId}/recordings/stop/`, {
    method: 'POST',
  })
}
