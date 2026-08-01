import { Cast, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyDestinationStateProps {
  onConnect: () => void
}

export function EmptyDestinationState({ onConnect }: EmptyDestinationStateProps) {
  return (
    <div
      className="destination-animate-fade flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-card/50 px-6 py-12 text-center sm:px-10 sm:py-16"
      role="status"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Cast className="h-10 w-10" strokeWidth={1.5} />
      </div>
      <h2 className="text-fluid-lg font-semibold tracking-tight">No destinations connected yet</h2>
      <p className="mt-2 max-w-md text-fluid-sm text-muted-foreground">
        Connect YouTube, Facebook, Twitch, or a Custom RTMP server to start broadcasting.
      </p>
      <Button onClick={onConnect} size="lg" className="mt-8">
        <Plus className="h-4 w-4" />
        Connect Destination
      </Button>
    </div>
  )
}
