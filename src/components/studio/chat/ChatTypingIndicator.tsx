import { cn } from '@/lib/utils'

interface ChatTypingIndicatorProps {
  names: string[]
  className?: string
}

export function ChatTypingIndicator({ names, className }: ChatTypingIndicatorProps) {
  if (names.length === 0) return null

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names.slice(0, -1).join(', ')} and ${names.at(-1)} are typing`

  return (
    <div
      className={cn('flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground', className)}
      aria-live="polite"
      aria-label={`${label}…`}
    >
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      <span className="italic">{label}…</span>
    </div>
  )
}
