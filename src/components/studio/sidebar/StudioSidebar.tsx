import { useState } from 'react'
import { Image, Layers, Users, Plus } from 'lucide-react'
import { GraphicsPanel } from '@/components/studio/sidebar/GraphicsPanel'
import { SourceTileList } from '@/components/studio/sidebar/SourceTileList'
import { SourceCard, SOURCE_TYPES } from '@/components/studio/sidebar/SourceCard'
import { InvitePanel } from '@/components/studio/InvitePanel'
import type { LayoutType } from '@/types/session'
import type { SidebarTab } from '@/types/studio'
import type { StudioTileSource } from '@/types/participants'
import type { GraphicLayerKey, GraphicsState } from '@/types/graphics'
import { cn } from '@/lib/utils'

interface StudioSidebarProps {
  layout: LayoutType
  isHost: boolean
  tileSources: StudioTileSource[]
  usingSceneOverride: boolean
  graphics: GraphicsState | null
  inviteUrl?: string
  onGraphicUpdate: (layer: GraphicLayerKey, value: GraphicsState[GraphicLayerKey]) => void
  onReorderSources: (fromIndex: number, toIndex: number) => void
  onResetTileOrder: () => void
  onPin: (sourceId: string) => void
  onHide: (sourceId: string) => void
  onMute?: (sourceId: string) => void
  onAddSource?: (sourceId: string) => void
  isSyncing?: boolean
}

const TABS: { id: SidebarTab; label: string; icon: typeof Layers }[] = [
  { id: 'graphics', label: 'Graphics', icon: Image },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'sources', label: 'Sources', icon: Plus },
]

export function StudioSidebar({
  layout,
  isHost,
  tileSources,
  usingSceneOverride,
  graphics,
  inviteUrl,
  onGraphicUpdate,
  onReorderSources,
  onResetTileOrder,
  onPin,
  onHide,
  onMute,
  onAddSource,
  isSyncing,
}: StudioSidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants')

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-l border-border/40 bg-card/50 transition-all duration-200',
        expanded ? 'w-72' : 'w-12',
      )}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {expanded ? (
          <>
            <div className="flex border-b border-border/40">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === 'graphics' && (
                <GraphicsPanel
                  layout={layout}
                  graphics={graphics}
                  isHost={isHost}
                  onUpdate={onGraphicUpdate}
                  disabled={isSyncing}
                />
              )}

              {activeTab === 'participants' && (
                <div className="space-y-3">
                  {inviteUrl && (
                    <InvitePanel inviteUrl={inviteUrl} className="rounded-lg border border-border/60 p-3" />
                  )}

                  <SourceTileList
                    sources={tileSources}
                    isHost={isHost}
                    usingSceneOverride={usingSceneOverride}
                    isSyncing={isSyncing}
                    onReorder={onReorderSources}
                    onReset={onResetTileOrder}
                    onPin={onPin}
                    onHide={onHide}
                    onMute={onMute}
                  />
                </div>
              )}

              {activeTab === 'sources' && (
                <div className="grid grid-cols-2 gap-2">
                  {SOURCE_TYPES.map((source) => (
                    <SourceCard key={source.id} source={source} onAdd={onAddSource} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setExpanded(true)
                }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-label={tab.label}
              >
                <tab.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="border-t border-border/40 px-3 py-2 text-center text-[10px] text-muted-foreground hover:text-foreground"
      >
        {expanded ? 'Collapse' : 'Expand'}
      </button>
    </aside>
  )
}
