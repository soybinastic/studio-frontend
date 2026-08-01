import { useEffect, useState } from 'react'
import { Image, Music2, Plus, Users } from 'lucide-react'
import { BackgroundMusicPanel } from '@/components/studio/audio/BackgroundMusicPanel'
import { GraphicsPanel } from '@/components/studio/sidebar/GraphicsPanel'
import { SourceTileList } from '@/components/studio/sidebar/SourceTileList'
import { SourceCard, SOURCE_TYPES } from '@/components/studio/sidebar/SourceCard'
import { InvitePanel } from '@/components/studio/InvitePanel'
import { StudioPanelShell } from '@/components/studio/layout/StudioPanelShell'
import { useIsDrawerMode, usePanelDefaultExpanded } from '@/hooks/useBreakpoint'
import type { BackgroundMusicStore } from '@/hooks/useBackgroundMusicStore'
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
  backgroundMusicStore: Pick<
    BackgroundMusicStore,
    | 'config'
    | 'runtime'
    | 'isMutating'
    | 'activeSceneName'
    | 'selectPreset'
    | 'removeTrack'
    | 'play'
    | 'pause'
    | 'resume'
    | 'stop'
    | 'setVolume'
    | 'setMuted'
  >
  inviteUrl?: string
  onGraphicUpdate: (layer: GraphicLayerKey, value: GraphicsState[GraphicLayerKey]) => void
  onGraphicUpdateLayers?: (partial: Partial<GraphicsState>) => void
  onReorderSources: (fromIndex: number, toIndex: number) => void
  onResetTileOrder: () => void
  onPin: (sourceId: string) => void
  onHide: (sourceId: string) => void
  onMute?: (sourceId: string) => void
  onAddSource?: (sourceId: string) => void
  isSyncing?: boolean
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
}

const TABS: { id: SidebarTab; label: string; icon: typeof Users }[] = [
  { id: 'graphics', label: 'Graphics', icon: Image },
  { id: 'participants', label: 'People', icon: Users },
  { id: 'sources', label: 'Sources', icon: Plus },
  { id: 'audio', label: 'Audio', icon: Music2 },
]

function SidebarTabs({
  activeTab,
  onTabChange,
  compact = false,
}: {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  compact?: boolean
}) {
  return (
    <div className={cn('flex rounded-lg bg-muted/50 p-0.5', compact ? 'flex-col gap-0.5' : 'w-full')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md font-medium transition-all',
            compact ? 'h-9 w-9' : 'flex-1 flex-col gap-0.5 px-1 py-1.5 text-[10px] sm:text-xs',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={tab.label}
          title={tab.label}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {!compact && tab.label}
        </button>
      ))}
    </div>
  )
}

export function StudioSidebar({
  layout,
  isHost,
  tileSources,
  usingSceneOverride,
  graphics,
  backgroundMusicStore,
  inviteUrl,
  onGraphicUpdate,
  onGraphicUpdateLayers,
  onReorderSources,
  onResetTileOrder,
  onPin,
  onHide,
  onMute,
  onAddSource,
  isSyncing,
  drawerOpen = false,
  onDrawerOpenChange,
}: StudioSidebarProps) {
  const drawerMode = useIsDrawerMode()
  const defaultExpanded = usePanelDefaultExpanded()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants')
  const showExpandedContent = drawerMode || expanded

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  return (
    <StudioPanelShell
      side="right"
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedWidth="w-72 lg:w-80 xl:w-96"
      drawerMode={drawerMode}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={onDrawerOpenChange}
      drawerTitle="Studio controls"
      header={<SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      {showExpandedContent ? (
        <div className="studio-panel-scroll flex-1 overflow-y-auto p-3">
          {activeTab === 'graphics' && (
            <GraphicsPanel
              layout={layout}
              graphics={graphics}
              isHost={isHost}
              onUpdate={onGraphicUpdate}
              onUpdateLayers={onGraphicUpdateLayers}
              disabled={isSyncing}
              isSaving={isSyncing}
            />
          )}

          {activeTab === 'participants' && (
            <div className="space-y-3">
              {inviteUrl && (
                <InvitePanel inviteUrl={inviteUrl} className="rounded-lg border border-border/60 bg-background/50 p-3" />
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SOURCE_TYPES.map((source) => (
                <SourceCard key={source.id} source={source} onAdd={onAddSource} />
              ))}
            </div>
          )}

          {activeTab === 'audio' && (
            <BackgroundMusicPanel isHost={isHost} store={backgroundMusicStore} />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-2">
          <SidebarTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab)
              setExpanded(true)
            }}
            compact
          />
        </div>
      )}
    </StudioPanelShell>
  )
}
