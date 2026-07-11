import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Mini Streaming Studio</span>
            <span className="sm:hidden">Studio</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
