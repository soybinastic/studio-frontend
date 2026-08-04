import { cn } from '@/lib/utils'
import { UnreadBadge } from '@/components/studio/chat/UnreadBadge'

export type ChatSubTab = 'participants' | 'socials'

interface ChatSubTabsProps {
  activeTab: ChatSubTab
  onTabChange: (tab: ChatSubTab) => void
  participantUnread?: number
  socialUnread?: number
  className?: string
}

const SUB_TABS: { id: ChatSubTab; label: string }[] = [
  { id: 'participants', label: 'Participants' },
  { id: 'socials', label: 'Socials' },
]

export function ChatSubTabs({
  activeTab,
  onTabChange,
  participantUnread = 0,
  socialUnread = 0,
  className,
}: ChatSubTabsProps) {
  return (
    <div
      className={cn('flex rounded-lg bg-muted/50 p-0.5', className)}
      role="tablist"
      aria-label="Chat categories"
    >
      {SUB_TABS.map((tab) => {
        const unread = tab.id === 'participants' ? participantUnread : socialUnread
        const selected = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{tab.label}</span>
            <UnreadBadge count={unread} />
          </button>
        )
      })}
    </div>
  )
}
