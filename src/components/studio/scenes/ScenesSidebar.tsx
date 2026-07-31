import { useState } from 'react'
import { Layers, Loader2, Plus } from 'lucide-react'
import { SceneListItem } from '@/components/studio/scenes/SceneListItem'
import { Button } from '@/components/ui/button'
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
}: ScenesSidebarProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border/40 bg-card/50 transition-all duration-200',
        expanded ? 'w-56' : 'w-12',
      )}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        {expanded ? (
          <>
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Scenes
              </div>
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
              {scenes.length === 0 && !isLoading ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">No scenes yet</p>
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

            {isHost && (
              <div className="border-t border-border/40 p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  disabled={isMutating}
                  onClick={onAddScene}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Scene
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-label="Scenes"
            >
              <Layers className="h-4 w-4" />
            </button>
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
