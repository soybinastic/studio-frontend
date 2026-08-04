import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SocialChatOverlayToggleProps {
  enabled: boolean
  disabled?: boolean
  syncing?: boolean
  onEnabledChange: (enabled: boolean) => void
  className?: string
}

export function SocialChatOverlayToggle({
  enabled,
  disabled = false,
  syncing = false,
  onEnabledChange,
  className,
}: SocialChatOverlayToggleProps) {
  return (
    <div
      className={cn(
        'mb-2 flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2',
        className,
      )}
    >
      <div className="min-w-0">
        <Label htmlFor="social-chat-overlay" className="text-xs font-medium">
          Chat overlay
        </Label>
        <p className="text-[10px] text-muted-foreground">
          Show social comments on the live stream preview and output.
        </p>
      </div>

      <button
        id="social-chat-overlay"
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-busy={syncing}
        disabled={disabled || syncing}
        onClick={() => onEnabledChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          enabled ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-background shadow transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0.5',
          )}
        >
          {syncing ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
        </span>
      </button>
    </div>
  )
}
