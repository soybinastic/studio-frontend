import type { ConnectionState, ParticipantMedia } from '@/types/session'

export interface StudioParticipant extends ParticipantMedia {
  slotIndex: number
  isHost: boolean
  isPinned: boolean
  isHidden: boolean
  isSpeaking: boolean
  connectionStatus: ConnectionState
  avatarUrl?: string
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
