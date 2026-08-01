import type { DestinationPlatform } from '@/types/destinations'
import { DestinationPlatform as Platform } from '@/types/destinations'
import { PLATFORM_BY_ID } from '@/constants/destinations'
import { cn } from '@/lib/utils'

interface PlatformIconProps {
  platform: DestinationPlatform
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
} as const

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.7 15.5V8.5L15.8 12l-6.1 3.5z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.08 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.09 24 18.08 24 12.07z" />
    </svg>
  )
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.64 5.5H9.5V8.64h2.14V5.5zm5.36 0h-2.14V8.64H17V5.5zM4.5 0L2 2.5v17.5h5.36V24l2.5-2.5h3.93L21.5 14V0H4.5zm14.64 12.86l-3.93 3.93h-3.93l-2.5 2.5v-2.5H6.5V2.5h12.64v10.36z" />
    </svg>
  )
}

function RtmpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 12h8M12 8v8" strokeLinecap="round" />
    </svg>
  )
}

const ICONS: Record<DestinationPlatform, React.ComponentType<{ className?: string }>> = {
  [Platform.YOUTUBE]: YouTubeIcon,
  [Platform.FACEBOOK]: FacebookIcon,
  [Platform.TWITCH]: TwitchIcon,
  [Platform.CUSTOM_RTMP]: RtmpIcon,
}

export function PlatformIcon({ platform, size = 'md', className }: PlatformIconProps) {
  const def = PLATFORM_BY_ID[platform]
  const Icon = ICONS[platform]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: def.brandColor }}
      aria-hidden="true"
    >
      <Icon className={iconSizeMap[size]} />
    </div>
  )
}

export function getPlatformLabel(platform: DestinationPlatform): string {
  return PLATFORM_BY_ID[platform].name
}
