export type LayoutType =
  | 'CONTAIN'
  | 'COVER'
  | 'THUMBNAIL'
  | 'GRID'
  | 'SIDE_BY_SIDE'
  | 'HALFSCREEN'
  | 'SPOTLIGHT'
  | 'CINEMA'
  | 'PICTURE_IN_PICTURE'
  | 'OVERLAY'
  | 'FULLSCREEN'

export type SessionStatus = 'CREATED' | 'ACTIVE' | 'ENDED'

export interface SessionCreateRequest {
  host_display_name: string
  layout?: LayoutType
}

export interface SessionCreateResponse {
  session_id: string
  room_id: string
  status: SessionStatus
  layout: LayoutType
  host_display_name: string
  invite_url: string
  mediasoup_ws_url: string
  created_at: string
}

export interface Session {
  session_id: string
  room_id: string
  host_display_name: string
  layout: LayoutType
  status: SessionStatus
  created_at: string
  ended_at: string | null
}

export interface InviteValidationResponse {
  valid: boolean
  session_id: string
  room_id: string
  mediasoup_ws_url: string
  layout: LayoutType
  host_display_name: string
}

export interface Recording {
  recording_id: string
  session_id: string
  status: 'RECORDING' | 'STOPPED' | 'FAILED'
  file_path: string
  started_at: string
  stopped_at: string | null
}

export interface Stream {
  stream_id: string
  session_id: string
  destination_type: 'RTMP' | 'HLS'
  destination_url: string
  output_path: string
  status: 'LIVE' | 'STOPPED' | 'FAILED'
  started_at: string
  stopped_at: string | null
}

export interface IngestStatus {
  session_id: string
  room_id: string
  compositor_peer_id: string
  layout: LayoutType
  joined: boolean
  composited_frames: number
  canvas_width: number
  canvas_height: number
  host_peer_id: string | null
  recording_active: boolean
  recording_file_path: string | null
  streaming_active: boolean
  streaming_destination_type: string | null
  streaming_destination_url: string | null
  participants: Array<{
    participant_peer_id: string
    audio_buffers: number
    video_buffers: number
    rtp_audio_packets: number
    rtp_video_packets: number
    rtcp_audio_packets: number
    rtcp_video_packets: number
  }>
  rtmp_sources: Array<{
    source_id: string
    url: string
    display_name: string
    video_buffers: number
    audio_buffers: number
  }>
}

export interface StudioSessionContext {
  sessionId: string
  roomId: string
  mediasoupWsUrl: string
  layout: LayoutType
  hostDisplayName: string
  inviteUrl?: string
  isHost: boolean
  displayName: string
  peerId: string
}

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export interface ParticipantMedia {
  peerId: string
  displayName: string
  audioTrack?: MediaStreamTrack
  videoTrack?: MediaStreamTrack
  audioEnabled: boolean
  videoEnabled: boolean
  isLocal: boolean
}
