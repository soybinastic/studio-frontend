import { Image, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudioMobileNavProps {
  scenesOpen: boolean
  controlsOpen: boolean
  onScenesOpen: () => void
  onControlsOpen: () => void
  className?: string
}

export function StudioMobileNav({
  scenesOpen,
  controlsOpen,
  onScenesOpen,
  onControlsOpen,
  className,
}: StudioMobileNavProps) {
  return (
    <nav
      className={cn('studio-mobile-nav', className)}
      aria-label="Studio panel navigation"
    >
      <Button
        type="button"
        variant={scenesOpen ? 'secondary' : 'outline'}
        size="sm"
        className="touch-target min-w-[7rem] flex-1 gap-2"
        onClick={onScenesOpen}
        aria-pressed={scenesOpen}
      >
        <Layers className="h-4 w-4 shrink-0" />
        Scenes
      </Button>
      <Button
        type="button"
        variant={controlsOpen ? 'secondary' : 'outline'}
        size="sm"
        className="touch-target min-w-[7rem] flex-1 gap-2"
        onClick={onControlsOpen}
        aria-pressed={controlsOpen}
      >
        <Image className="h-4 w-4 shrink-0" />
        Controls
      </Button>
    </nav>
  )
}
