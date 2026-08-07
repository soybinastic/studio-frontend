import { useCallback, useEffect, useState } from 'react'
import { Image, MessageSquare, Music2, Plus, Users } from 'lucide-react'
import { BackgroundMusicPanel } from '@/components/studio/audio/BackgroundMusicPanel'
import { ChatPanel } from '@/components/studio/chat/ChatPanel'
import { GraphicsPanel } from '@/components/studio/sidebar/GraphicsPanel'
import { SourceTileList } from '@/components/studio/sidebar/SourceTileList'
import { SourcesPanel } from '@/components/studio/sidebar/SourcesPanel'
import { InvitePanel } from '@/components/studio/InvitePanel'
import { StudioPanelShell } from '@/components/studio/layout/StudioPanelShell'
import { useIsDrawerMode, usePanelDefaultExpanded } from '@/hooks/useBreakpoint'
import type { BackgroundMusicStore } from '@/hooks/useBackgroundMusicStore'
import type { SessionSourcesStore } from '@/hooks/useSessionSourcesStore'
import type { LayoutType } from '@/types/session'
import type { SidebarTab } from '@/types/studio'
import type { StudioTileSource } from '@/types/participants'
import type { GraphicLayerKey, GraphicsState } from '@/types/graphics'
import type { ParticipantMedia } from '@/types/session'
import type { useStudioChat } from '@/hooks/useStudioChat'
import { useChatUnread } from '@/hooks/useChatUnread'
import { UnreadBadge } from '@/components/studio/chat/UnreadBadge'
import type { ChatSubTab } from '@/components/studio/chat/ChatSubTabs'
import { cn } from '@/lib/utils'

type StudioChatStore = ReturnType<typeof useStudioChat>

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
  isSyncing?: boolean
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
  sessionId?: string
  activeSceneId?: string | null
  sourcesStore?: SessionSourcesStore
  produceCameraSource?: (sourceId: string, deviceId: string) => Promise<{ producerId: string }>
  stopCameraSource?: (sourceId: string) => Promise<void>
  produceScreenShare?: (sourceId: string) => Promise<{ producerId: string }>
  stopScreenShare?: (sourceId: string) => Promise<void>
  currentUserId?: string
  hostPeerId?: string
  participants?: ParticipantMedia[]
  chat?: StudioChatStore
  socialChatOverlay?: {
    enabled: boolean
    syncing: boolean
    setOverlayEnabled: (enabled: boolean) => Promise<void>
  }
}

const TABS: { id: SidebarTab; label: string; icon: typeof Users }[] = [
  { id: 'graphics', label: 'Graphics', icon: Image },
  { id: 'participants', label: 'People', icon: Users },
  { id: 'sources', label: 'Sources', icon: Plus },
  { id: 'audio', label: 'Audio', icon: Music2 },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
]

function SidebarTabs({
  activeTab,
  onTabChange,
  compact = false,
  chatUnread = 0,
}: {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  compact?: boolean
  chatUnread?: number
}) {
  return (
    <div className={cn('flex rounded-lg bg-muted/50 p-0.5', compact ? 'flex-col gap-0.5' : 'w-full')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative flex items-center justify-center gap-1 rounded-md font-medium transition-all',
            compact ? 'h-9 w-9' : 'flex-1 flex-col gap-0.5 px-1 py-1.5 text-[10px] sm:text-xs',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label={tab.id === 'chat' && chatUnread > 0 ? `${tab.label}, ${chatUnread} unread` : tab.label}
          title={tab.label}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {!compact && (
            <span className="flex items-center gap-0.5">
              {tab.label}
              {tab.id === 'chat' && <UnreadBadge count={chatUnread} />}
            </span>
          )}
          {compact && tab.id === 'chat' && chatUnread > 0 && (
            <UnreadBadge count={chatUnread} className="absolute -right-0.5 -top-0.5" />
          )}
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
  isSyncing,
  drawerOpen = false,
  onDrawerOpenChange,
  sessionId,
  activeSceneId = null,
  sourcesStore,
  produceCameraSource,
  stopCameraSource,
  produceScreenShare,
  stopScreenShare,
  currentUserId,
  hostPeerId,
  participants = [],
  chat,
  socialChatOverlay,
}: StudioSidebarProps) {
  const drawerMode = useIsDrawerMode()
  const defaultExpanded = usePanelDefaultExpanded()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [activeTab, setActiveTab] = useState<SidebarTab>('participants')
  const [chatSubTab, setChatSubTab] = useState<ChatSubTab>('participants')
  const showExpandedContent = drawerMode || expanded

  const isChatTabActive = activeTab === 'chat' && showExpandedContent

  const { participantUnread, socialUnread, totalUnread } = useChatUnread({
    messages: chat?.messages ?? [],
    socialComments: chat?.socialComments ?? [],
    currentUserId: currentUserId ?? '',
    isChatTabActive,
    chatSubTab,
  })

  const handleTabChange = useCallback((tab: SidebarTab) => {
    setActiveTab(tab)
    if (tab === 'chat') {
      setExpanded(true)
    }
  }, [])

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
      header={<SidebarTabs activeTab={activeTab} onTabChange={handleTabChange} chatUnread={totalUnread} />}
    >
      {showExpandedContent ? (
        <div
          className={cn(
            'studio-panel-scroll flex-1 p-3',
            activeTab === 'chat' ? 'flex min-h-0 flex-col overflow-hidden' : 'overflow-y-auto',
          )}
        >
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

          {activeTab === 'sources' && sourcesStore && (
            <SourcesPanel
              isHost={isHost}
              sessionId={sessionId}
              activeSceneId={activeSceneId}
              sourcesStore={sourcesStore}
              peerId={currentUserId}
              produceCameraSource={produceCameraSource}
              stopCameraSource={stopCameraSource}
              produceScreenShare={produceScreenShare}
              stopScreenShare={stopScreenShare}
            />
          )}

          {activeTab === 'audio' && (
            <BackgroundMusicPanel isHost={isHost} store={backgroundMusicStore} />
          )}

          {activeTab === 'chat' && chat && sessionId && currentUserId && hostPeerId && (
            <ChatPanel
              sessionId={sessionId}
              isHost={isHost}
              currentUserId={currentUserId}
              hostPeerId={hostPeerId}
              participants={participants}
              chat={chat}
              subTab={chatSubTab}
              onSubTabChange={setChatSubTab}
              participantUnread={participantUnread}
              socialUnread={socialUnread}
              socialChatOverlay={socialChatOverlay}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-2">
          <SidebarTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              handleTabChange(tab)
              setExpanded(true)
            }}
            compact
            chatUnread={totalUnread}
          />
        </div>
      )}
    </StudioPanelShell>
  )
}
