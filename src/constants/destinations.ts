import type { DestinationPlatform, DestinationStatus } from '@/types/destinations'
import { DestinationPlatform as Platform, DestinationStatus as Status } from '@/types/destinations'

export interface PlatformDefinition {
  id: DestinationPlatform
  name: string
  description: string
  brandColor: string
  connectTitle: string
  connectDescription: string
  oauthLabel: string
}

export const PLATFORM_DEFINITIONS: PlatformDefinition[] = [
  {
    id: Platform.YOUTUBE,
    name: 'YouTube',
    description: 'Broadcast directly to your YouTube channel.',
    brandColor: '#FF0000',
    connectTitle: 'Connect YouTube',
    connectDescription: 'Connect your YouTube account to stream live.',
    oauthLabel: 'Continue with Google',
  },
  {
    id: Platform.FACEBOOK,
    name: 'Facebook',
    description: 'Stream to your Facebook Profile or Page.',
    brandColor: '#1877F2',
    connectTitle: 'Connect Facebook',
    connectDescription: 'Choose where you want to stream.',
    oauthLabel: 'Continue with Facebook',
  },
  {
    id: Platform.TWITCH,
    name: 'Twitch',
    description: 'Broadcast live to Twitch.',
    brandColor: '#9146FF',
    connectTitle: 'Connect Twitch',
    connectDescription: 'Connect your Twitch account to stream live.',
    oauthLabel: 'Continue with Twitch',
  },
  {
    id: Platform.CUSTOM_RTMP,
    name: 'Custom RTMP',
    description: 'Connect using Stream URL and Stream Key.',
    brandColor: 'var(--primary)',
    connectTitle: 'Custom RTMP',
    connectDescription: 'Enter your RTMP server details to connect a custom destination.',
    oauthLabel: 'Save',
  },
]

export const PLATFORM_BY_ID = Object.fromEntries(
  PLATFORM_DEFINITIONS.map((p) => [p.id, p]),
) as Record<DestinationPlatform, PlatformDefinition>

export interface StatusDefinition {
  label: string
  badgeVariant: 'success' | 'secondary' | 'destructive' | 'live' | 'outline' | 'default'
  dotColor: string
}

export const STATUS_DEFINITIONS: Record<DestinationStatus, StatusDefinition> = {
  [Status.CONNECTED]: {
    label: 'Connected',
    badgeVariant: 'success',
    dotColor: 'bg-emerald-500',
  },
  [Status.DISCONNECTED]: {
    label: 'Disconnected',
    badgeVariant: 'secondary',
    dotColor: 'bg-muted-foreground',
  },
  [Status.AUTH_EXPIRED]: {
    label: 'Auth Expired',
    badgeVariant: 'destructive',
    dotColor: 'bg-destructive',
  },
  [Status.CONNECTING]: {
    label: 'Connecting',
    badgeVariant: 'default',
    dotColor: 'bg-primary',
  },
  [Status.STREAMING]: {
    label: 'Streaming',
    badgeVariant: 'live',
    dotColor: 'bg-live',
  },
  [Status.ERROR]: {
    label: 'Error',
    badgeVariant: 'destructive',
    dotColor: 'bg-destructive',
  },
}

export const MODAL_STEP_BY_PLATFORM: Record<
  Exclude<DestinationPlatform, typeof Platform.CUSTOM_RTMP>,
  'connect-youtube' | 'connect-facebook' | 'connect-twitch'
> = {
  [Platform.YOUTUBE]: 'connect-youtube',
  [Platform.FACEBOOK]: 'connect-facebook',
  [Platform.TWITCH]: 'connect-twitch',
}
