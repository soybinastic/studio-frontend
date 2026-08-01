import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ScenePreviewThumbnail } from '@/components/studio/scenes/ScenePreviewThumbnail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Scene } from '@/types/scenes'
import { cn } from '@/lib/utils'

interface SceneCardItemProps {
  scene: Scene
  isHost: boolean
  disabled?: boolean
  onActivate: (sceneId: string) => void
  onRename: (sceneId: string, name: string) => void
  onDelete: (sceneId: string) => void
}

export function SceneCardItem({
  scene,
  isHost,
  disabled,
  onActivate,
  onRename,
  onDelete,
}: SceneCardItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(scene.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const isCountdown = scene.type === 'COUNTDOWN'
  const canActivate = isHost && (isCountdown || !scene.is_active)

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

  const handleActivate = useCallback(() => {
    if (!canActivate || disabled) return
    onActivate(scene.scene_id)
  }, [canActivate, disabled, onActivate, scene.scene_id])

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border shadow-sm transition-shadow',
        scene.is_active ? 'border-primary/40 shadow-md ring-1 ring-primary/20' : 'border-border/50',
      )}
    >
      <div
        role={canActivate ? 'button' : undefined}
        tabIndex={canActivate && !disabled ? 0 : undefined}
        onClick={handleActivate}
        onKeyDown={(event) => {
          if (!canActivate || disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleActivate()
          }
        }}
        className={cn(
          'relative w-full',
          canActivate && !disabled && 'cursor-pointer hover:opacity-95',
        )}
        aria-label={canActivate ? (isCountdown ? `Start ${scene.name}` : `Switch to ${scene.name}`) : undefined}
      >
        <ScenePreviewThumbnail scene={scene} />

        {isHost && !scene.is_active && (
          <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-6 w-6 bg-background/90 shadow-sm backdrop-blur-sm"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                onDelete(scene.scene_id)
              }}
              aria-label={`Delete ${scene.name}`}
              title="Delete scene"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          'px-2 py-1.5',
          scene.is_active ? 'bg-primary text-primary-foreground' : 'border-t border-border/50 bg-card',
        )}
      >
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
            className={cn(
              'h-6 border-none px-1 text-[11px] shadow-none focus-visible:ring-1',
              scene.is_active
                ? 'bg-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/70'
                : 'bg-muted/50',
            )}
          />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 truncate text-left text-[11px] font-medium',
                isHost && 'cursor-text hover:underline',
                scene.is_active ? 'text-primary-foreground' : 'text-foreground',
              )}
              onClick={() => isHost && setIsEditing(true)}
              title={scene.name}
            >
              {scene.name}
            </button>

            {!isHost && scene.is_active && (
              <Badge
                variant="secondary"
                className="shrink-0 border-none bg-primary-foreground/20 px-1.5 py-0 text-[9px] text-primary-foreground"
              >
                Live
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
