import { cn } from '@/lib/utils'

export type ChatSubTab = 'participants' | 'socials'

interface ChatSubTabsProps {
  activeTab: ChatSubTab
  onTabChange: (tab: ChatSubTab) => void
  className?: string
}

const SUB_TABS: { id: ChatSubTab; label: string }[] = [
  { id: 'participants', label: 'Participants' },
  { id: 'socials', label: 'Socials' },
]

export function ChatSubTabs({ activeTab, onTabChange, className }: ChatSubTabsProps) {
  return (
    <div className={cn('flex rounded-lg bg-muted/50 p-0.5', className)}>
      {SUB_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
