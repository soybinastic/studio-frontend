import { Loader2, WifiOff } from 'lucide-react'
import type { StudioChatConnectionState } from '@/types/chat-message'
import { cn } from '@/lib/utils'

interface ChatConnectionStatusProps {
  state: StudioChatConnectionState
  error?: string | null
  className?: string
}

const LABELS: Record<StudioChatConnectionState, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Connection error',
}

export function ChatConnectionStatus({ state, error, className }: ChatConnectionStatusProps) {
  if (state === 'connected') return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground',
        state === 'error' && 'border-destructive/40 text-destructive',
        className,
      )}
    >
      {state === 'connecting' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span>{error ?? LABELS[state]}</span>
    </div>
  )
}
