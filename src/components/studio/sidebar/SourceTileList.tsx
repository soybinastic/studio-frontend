import { useState } from 'react'
import type { DragEvent } from 'react'
import { RotateCcw } from 'lucide-react'
import { SourceTileCard } from '@/components/studio/sidebar/SourceTileCard'
import { Button } from '@/components/ui/button'
import type { StudioTileSource } from '@/types/participants'
import { cn } from '@/lib/utils'

interface SourceTileListProps {
  sources: StudioTileSource[]
  isHost: boolean
  usingSceneOverride: boolean
  isSyncing?: boolean
  onReorder: (fromIndex: number, toIndex: number) => void
  onReset: () => void
  onPin: (sourceId: string) => void
  onHide: (sourceId: string) => void
  onMute?: (sourceId: string) => void
}

export function SourceTileList({
  sources,
  isHost,
  usingSceneOverride,
  isSyncing = false,
  onReorder,
  onReset,
  onPin,
  onHide,
  onMute,
}: SourceTileListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const visibleSources = sources.filter((source) => !source.isHidden)
  const hiddenSources = sources.filter((source) => source.isHidden)
  const canSort = isHost && visibleSources.length > 1

  const handleDragOver = (event: DragEvent, index: number) => {
    if (!canSort || dragIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    onReorder(dragIndex, targetIndex)
    setDragIndex(null)
    setOverIndex(null)
  }

  const clearDrag = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  if (sources.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No video sources yet
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {isHost && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-[10px] leading-snug text-muted-foreground">
            {usingSceneOverride ? 'Scene tile order' : 'Session default order'}
            {canSort && ' · drag to reorder'}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            disabled={isSyncing}
            onClick={() => onReset()}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {canSort && dragIndex !== null && (
          <div
            className={cn(
              'h-2 rounded transition-colors',
              overIndex === 0 && dragIndex !== 0 && 'bg-primary/30',
            )}
            onDragOver={(event) => handleDragOver(event, 0)}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(0)
            }}
          />
        )}

        {visibleSources.map((source, index) => (
          <SourceTileCard
            key={source.sourceId}
            source={source}
            sortable={canSort}
            isDragging={dragIndex === index}
            isDragOver={overIndex === index && dragIndex !== null && dragIndex !== index}
            onDragHandleStart={() => setDragIndex(index)}
            onDragHandleEnd={clearDrag}
            onDragOver={(event) => handleDragOver(event, index)}
            onDrop={() => handleDrop(index)}
            onPin={isHost ? onPin : undefined}
            onHide={isHost ? onHide : undefined}
            onMute={onMute}
          />
        ))}
      </div>

      {hiddenSources.length > 0 && (
        <div className="space-y-2 border-t border-border/40 pt-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hidden from output</p>
          {hiddenSources.map((source) => (
            <SourceTileCard
              key={source.sourceId}
              source={source}
              onPin={isHost ? onPin : undefined}
              onHide={isHost ? onHide : undefined}
              onMute={onMute}
            />
          ))}
        </div>
      )}
    </div>
  )
}
