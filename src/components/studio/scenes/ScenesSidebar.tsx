import { useEffect, useState } from 'react'
import { Layers, LayoutGrid, LayoutList, Loader2, Plus } from 'lucide-react'
import { SceneListItem } from '@/components/studio/scenes/SceneListItem'
import { SceneCardItem } from '@/components/studio/scenes/SceneCardItem'
import { StudioPanelShell } from '@/components/studio/layout/StudioPanelShell'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { useSceneViewPreference } from '@/hooks/useSceneViewPreference'
import { useIsDrawerMode, usePanelDefaultExpanded } from '@/hooks/useBreakpoint'
import type { Scene } from '@/types/scenes'
import { cn } from '@/lib/utils'

interface ScenesSidebarProps {
  scenes: Scene[]
  isHost: boolean
  isLoading?: boolean
  isMutating?: boolean
  onAddScene: () => void
  onActivate: (sceneId: string) => void
  onRename: (sceneId: string, name: string) => void
  onDelete: (sceneId: string) => void
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
}

export function ScenesSidebar({
  scenes,
  isHost,
  isLoading,
  isMutating,
  onAddScene,
  onActivate,
  onRename,
  onDelete,
  drawerOpen = false,
  onDrawerOpenChange,
}: ScenesSidebarProps) {
  const drawerMode = useIsDrawerMode()
  const defaultExpanded = usePanelDefaultExpanded()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { viewMode, setViewMode } = useSceneViewPreference(isHost)
  const isCardView = viewMode === 'card'
  const showExpandedContent = drawerMode || expanded

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  return (
    <StudioPanelShell
      side="left"
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedWidth="w-60 lg:w-64"
      drawerMode={drawerMode}
      drawerOpen={drawerOpen}
      onDrawerOpenChange={onDrawerOpenChange}
      drawerTitle="Scenes"
      header={
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-medium">Scenes</span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

            {isHost && (
              <div className="flex items-center rounded-md border border-border/60 p-0.5">
                <Toggle
                  size="sm"
                  pressed={viewMode === 'list'}
                  onPressedChange={(pressed) => pressed && setViewMode('list')}
                  className="h-7 w-7 rounded-sm px-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  aria-label="List view"
                  title="List view"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={viewMode === 'card'}
                  onPressedChange={(pressed) => pressed && setViewMode('card')}
                  className="h-7 w-7 rounded-sm px-0 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                  aria-label="Card view"
                  title="Card view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Toggle>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        isHost ? (
          <div className="p-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              disabled={isMutating}
              onClick={onAddScene}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Scene
            </Button>
          </div>
        ) : undefined
      }
    >
      {showExpandedContent ? (
        <div
          className={cn(
            'studio-panel-scroll flex-1 overflow-y-auto p-2.5',
            isCardView ? 'space-y-1.5' : 'space-y-1',
          )}
        >
          {scenes.length === 0 && !isLoading ? (
            <p className="px-1 py-6 text-center text-xs leading-relaxed text-muted-foreground">
              No scenes yet
              {isHost && (
                <>
                  <br />
                  <span className="text-[11px]">Add one to get started</span>
                </>
              )}
            </p>
          ) : isCardView ? (
            scenes.map((scene) => (
              <SceneCardItem
                key={scene.scene_id}
                scene={scene}
                isHost={isHost}
                disabled={isMutating}
                onActivate={onActivate}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))
          ) : (
            scenes.map((scene) => (
              <SceneListItem
                key={scene.scene_id}
                scene={scene}
                isHost={isHost}
                disabled={isMutating}
                onActivate={onActivate}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 py-2">
          {scenes.slice(0, 6).map((scene) => (
            <button
              key={scene.scene_id}
              type="button"
              onClick={() => {
                setExpanded(true)
                onActivate(scene.scene_id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/80"
              title={scene.name}
              aria-label={scene.name}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  scene.is_active ? 'bg-primary ring-2 ring-primary/30' : 'bg-muted-foreground/40',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </StudioPanelShell>
  )
}
