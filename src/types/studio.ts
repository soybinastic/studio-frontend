export type OutputState = 'idle' | 'starting' | 'active' | 'stopping' | 'disabled'

export type SidebarTab = 'graphics' | 'participants' | 'sources' | 'audio'

export interface RecordingState {
  status: OutputState
  recordingId: string | null
  startedAt: string | null
}

export interface StreamingState {
  status: OutputState
  streamId: string | null
  destinationType: 'RTMP' | 'HLS' | null
  startedAt: string | null
}

export interface BackendSyncState {
  isSyncing: boolean
  lastSyncedAt: string | null
  pendingChanges: string[]
  error: string | null
}

export interface PreviewState {
  aspectRatio: '16:9'
  showSafeZones: boolean
  showGrid: boolean
}
