import type { ConnectionState, ParticipantMedia } from '@/types/session'

export interface StudioTileSource {
  sourceId: string
  kind: 'participant' | 'rtmp'
  displayName: string
  slotIndex: number
  isHost: boolean
  isHidden: boolean
  isPinned: boolean
  isSpeaking: boolean
  isLocal?: boolean
  audioEnabled?: boolean
  videoEnabled?: boolean
  connectionStatus?: ConnectionState
  videoTrack?: MediaStreamTrack
  audioTrack?: MediaStreamTrack
  rtmpUrl?: string
}

export interface StudioParticipant extends ParticipantMedia {
  slotIndex: number
  isHost: boolean
  isPinned: boolean
  isHidden: boolean
  isSpeaking: boolean
  connectionStatus: ConnectionState
  avatarUrl?: string
}

export function tileSourceToStudioParticipant(source: StudioTileSource): StudioParticipant {
  return {
    peerId: source.sourceId,
    displayName: source.displayName,
    audioTrack: source.audioTrack,
    videoTrack: source.videoTrack,
    audioEnabled: source.audioEnabled ?? false,
    videoEnabled: source.videoEnabled ?? false,
    isLocal: source.isLocal ?? false,
    slotIndex: source.slotIndex,
    isHost: source.isHost,
    isPinned: source.isPinned,
    isHidden: source.isHidden,
    isSpeaking: source.isSpeaking,
    connectionStatus: source.connectionStatus ?? 'connected',
  }
}

export interface ParticipantAction {
  peerId: string
  type: 'pin' | 'unpin' | 'hide' | 'show' | 'mute' | 'unmute'
}

export interface SourceType {
  id: string
  label: string
  icon: string
  enabled: boolean
  category: 'camera' | 'screen' | 'media' | 'external'
}
