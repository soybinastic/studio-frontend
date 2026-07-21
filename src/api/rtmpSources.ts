import { apiRequest } from '@/api/client'

export interface RtmpSource {
  source_id: string
  session_id: string
  url: string
  display_name: string
  status: 'ACTIVE' | 'STOPPED' | 'FAILED'
  started_at: string
  stopped_at: string | null
  video_buffers: number
  audio_buffers: number
}

export function listRtmpSources(sessionId: string) {
  return apiRequest<RtmpSource[]>(`/sessions/${sessionId}/rtmp-sources/`)
}

export function addRtmpSource(
  sessionId: string,
  body: { url: string; display_name?: string },
) {
  return apiRequest<RtmpSource>(`/sessions/${sessionId}/rtmp-sources/add/`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function removeRtmpSource(sessionId: string, sourceId: string) {
  return apiRequest<RtmpSource>(`/sessions/${sessionId}/rtmp-sources/${sourceId}/`, {
    method: 'DELETE',
  })
}
