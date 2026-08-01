import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { StudioHeaderControls } from '@/components/studio/toolbar/StudioHeaderControls'
import { useStudioHeaderControls } from '@/context/StudioHeaderControlsProvider'

export function AppShell({ children }: { children: ReactNode }) {
  const { controls } = useStudioHeaderControls()

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Mini Streaming Studio</span>
            <span className="sm:hidden">Studio</span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {controls && <StudioHeaderControls {...controls} />}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
