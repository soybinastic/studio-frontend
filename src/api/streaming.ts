import { apiRequest } from '@/api/client'
import type { Stream } from '@/types/session'

export interface StreamDestinationInput {
  url: string
  label?: string
}

export interface StartStreamRequest {
  destination_type: 'RTMP' | 'HLS'
  destination_url?: string
  destination_urls?: string[]
  destinations?: StreamDestinationInput[]
}

export function listStreams(sessionId: string) {
  return apiRequest<Stream[]>(`/sessions/${sessionId}/streams/`)
}

export function startStream(sessionId: string, body: StartStreamRequest) {
  return apiRequest<Stream>(`/sessions/${sessionId}/streams/start/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function stopStream(sessionId: string) {
  return apiRequest<Stream>(`/sessions/${sessionId}/streams/stop/`, {
    method: 'POST',
  })
}
