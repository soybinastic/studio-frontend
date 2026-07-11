import { Loader2, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConnectionState } from '@/types/session'

interface ConnectionBannerProps {
  state: ConnectionState
  error?: string | null
}

export function ConnectionBanner({ state, error }: ConnectionBannerProps) {
  if (state === 'connected') {
    return (
      <Badge variant="live" className="gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        Live
      </Badge>
    )
  }

  if (state === 'connecting') {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting…
      </Badge>
    )
  }

  if (state === 'error' || state === 'disconnected') {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <WifiOff className="h-3 w-3" />
        {error ?? 'Disconnected'}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1.5">
      <Wifi className="h-3 w-3" />
      Ready
    </Badge>
  )
}
