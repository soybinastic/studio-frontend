import { useCallback, useEffect, useRef, useState } from 'react'
import type { Scene } from '@/types/scenes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Layers, Timer, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SceneListItemProps {
  scene: Scene
  isHost: boolean
  disabled?: boolean
  onActivate: (sceneId: string) => void
  onRename: (sceneId: string, name: string) => void
  onDelete: (sceneId: string) => void
}

export function SceneListItem({
  scene,
  isHost,
  disabled,
  onActivate,
  onRename,
  onDelete,
}: SceneListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(scene.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraftName(scene.name)
  }, [scene.name, isEditing])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commitRename = useCallback(() => {
    setIsEditing(false)
    if (draftName.trim() && draftName.trim() !== scene.name) {
      onRename(scene.scene_id, draftName.trim())
    } else {
      setDraftName(scene.name)
    }
  }, [draftName, onRename, scene.name, scene.scene_id])

  const isCountdown = scene.type === 'COUNTDOWN'

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors',
        scene.is_active
          ? 'bg-primary/10 ring-1 ring-primary/20'
          : 'bg-background/60 hover:bg-muted/60',
      )}
    >
      {scene.is_active && (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-primary" />
      )}

      {isCountdown ? (
        <Timer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      {isHost && isEditing ? (
        <Input
          ref={inputRef}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setDraftName(scene.name)
              setIsEditing(false)
            }
          }}
          className="h-7 flex-1 px-1.5 text-xs"
        />
      ) : (
        <button
          type="button"
          className={cn(
            'min-w-0 flex-1 truncate text-left text-xs font-medium',
            isHost && 'cursor-text hover:underline',
          )}
          onClick={() => isHost && setIsEditing(true)}
          title={scene.name}
        >
          {scene.name}
        </button>
      )}

      {isHost && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled || (!isCountdown && scene.is_active)}
            onClick={() => onActivate(scene.scene_id)}
            aria-label={isCountdown ? `Start ${scene.name}` : `Switch to ${scene.name}`}
            title={isCountdown ? 'Start countdown' : 'Switch to scene'}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {!scene.is_active && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              disabled={disabled}
              onClick={() => onDelete(scene.scene_id)}
              aria-label={`Delete ${scene.name}`}
              title="Delete scene"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {!isHost && scene.is_active && (
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[9px] font-medium text-primary">
          Live
        </Badge>
      )}
    </div>
  )
}
