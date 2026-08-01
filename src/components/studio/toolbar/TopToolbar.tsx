interface TopToolbarProps {
  title: string
  subtitle?: string
}

export function TopToolbar({ title, subtitle }: TopToolbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/40 px-4 py-3">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  )
}
