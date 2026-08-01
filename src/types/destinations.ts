export const DestinationPlatform = {
  YOUTUBE: 'youtube',
  FACEBOOK: 'facebook',
  TWITCH: 'twitch',
  CUSTOM_RTMP: 'custom_rtmp',
} as const

export type DestinationPlatform =
  (typeof DestinationPlatform)[keyof typeof DestinationPlatform]

export const DestinationStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  AUTH_EXPIRED: 'auth_expired',
  CONNECTING: 'connecting',
  STREAMING: 'streaming',
  ERROR: 'error',
} as const

export type DestinationStatus =
  (typeof DestinationStatus)[keyof typeof DestinationStatus]

export type FacebookTarget = 'profile' | 'page'

export interface ConnectedDestination {
  id: string
  platform: DestinationPlatform
  name: string
  status: DestinationStatus
  facebookTarget?: FacebookTarget
  rtmpUrl?: string
  streamKey?: string
  notes?: string
  createdAt: string
}

export type DestinationModalStep =
  | 'list'
  | 'select'
  | 'connect-youtube'
  | 'connect-facebook'
  | 'connect-twitch'
  | 'custom-rtmp'

export interface CustomRTMPFormValues {
  displayName: string
  rtmpUrl: string
  streamKey: string
  notes: string
}

export interface CustomRTMPFormErrors {
  displayName?: string
  rtmpUrl?: string
  streamKey?: string
}
