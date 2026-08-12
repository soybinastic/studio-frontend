import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { StudioHeaderControls } from '@/components/studio/toolbar/StudioHeaderControls'
import { useStudioHeaderControls } from '@/context/StudioHeaderControlsProvider'
import { useDestinationOutputs } from '@/context/DestinationOutputsProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isEmbeddedIntegration } from '@/lib/integration/integrationMode'
import broadcastStudioLogo from '@/assets/broadcast-studio-logo.png'

function StudioBrand({ embedded }: { embedded: boolean }) {
  const content = (
    <span className="inline-flex items-center rounded-md bg-black px-2 py-1">
      <img
        src={broadcastStudioLogo}
        alt="Broadcast Studio"
        className="h-6 w-auto max-w-[min(100%,13rem)] object-contain object-left sm:h-7 sm:max-w-[15rem]"
      />
    </span>
  )

  if (embedded) {
    return (
      <div className="flex min-w-0 shrink items-center" aria-label="Broadcast Studio">
        {content}
      </div>
    )
  }

  return (
    <Link
      to="/"
      className="flex min-w-0 shrink items-center"
      aria-label="Broadcast Studio"
    >
      {content}
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { controls } = useStudioHeaderControls()
  const { openDestinations } = useDestinationOutputs()
  const isEmbedded = isEmbeddedIntegration()

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 w-full min-w-0 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <StudioBrand embedded={isEmbedded} />
          </div>

          <div
            className={cn(
              'flex min-w-0 shrink items-center gap-1 sm:gap-2',
              controls && 'max-w-[min(100%,42rem)] overflow-x-auto',
            )}
          >
            {controls && <StudioHeaderControls {...controls} />}
            <Button
              variant="outline"
              size="sm"
              onClick={openDestinations}
              className="hidden sm:inline-flex"
            >
              Destinations
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openDestinations}
              className="sm:hidden"
              aria-label="Open destinations"
            >
              <Radio className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
