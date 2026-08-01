import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { StudioHeaderControls } from '@/components/studio/toolbar/StudioHeaderControls'
import { useStudioHeaderControls } from '@/context/StudioHeaderControlsProvider'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const { controls } = useStudioHeaderControls()

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 w-full min-w-0 items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 shrink items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-4 w-4" />
            </span>
            <span className="hidden truncate sm:inline">Mini Streaming Studio</span>
            <span className="truncate sm:hidden">Studio</span>
          </Link>

          <div
            className={cn(
              'flex min-w-0 shrink items-center gap-1 sm:gap-2',
              controls && 'max-w-[min(100%,42rem)] overflow-x-auto',
            )}
          >
            {controls && <StudioHeaderControls {...controls} />}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  )
}
