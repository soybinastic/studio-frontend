import { useMemo, useState } from 'react'
import type { DragEvent } from 'react'
import { SceneItemCard, type SceneItemRow } from '@/components/studio/sidebar/SceneItemCard'
import type { SceneItem } from '@/types/sources'
import type { Source } from '@/types/sources'
import { cn } from '@/lib/utils'

interface SceneItemsListProps {
  items: SceneItem[]
  sources: Source[]
  isHost: boolean
  isSyncing?: boolean
  onReorder: (fromIndex: number, toIndex: number) => void
  onToggleVisibility: (sourceId: string, visible: boolean) => void
  onDetach: (sourceId: string) => void
  onPlay?: (sourceId: string) => Promise<unknown>
  onPause?: (sourceId: string) => Promise<unknown>
  onSeek?: (sourceId: string, positionMs: number) => Promise<unknown>
  onVolumeChange?: (sourceId: string, volume: number) => Promise<unknown>
  onMutedChange?: (sourceId: string, muted: boolean) => Promise<unknown>
}

export function SceneItemsList({
  items,
  sources,
  isHost,
  isSyncing = false,
  onReorder,
  onToggleVisibility,
  onDetach,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMutedChange,
}: SceneItemsListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const rows = useMemo<SceneItemRow[]>(() => {
    const byId = new Map(sources.map((source) => [source.id, source]))
    return [...items]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((item) => ({
        itemId: item.id,
        sourceId: item.sourceId,
        visible: item.visible,
        zIndex: item.zIndex,
        source: byId.get(item.sourceId),
      }))
  }, [items, sources])

  const canSort = isHost && rows.length > 1 && !isSyncing

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

  if (rows.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-muted-foreground">
        No sources on this scene yet
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {isHost && canSort && (
        <p className="px-0.5 text-[10px] text-muted-foreground">
          Drag to reorder · eye toggles visibility · chevron opens video controls
        </p>
      )}

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

      {rows.map((row, index) => (
        <SceneItemCard
          key={row.itemId}
          row={row}
          sortable={canSort}
          disabled={isSyncing || !isHost}
          isDragging={dragIndex === index}
          isDragOver={overIndex === index && dragIndex !== null && dragIndex !== index}
          onDragHandleStart={() => setDragIndex(index)}
          onDragHandleEnd={clearDrag}
          onDragOver={(event) => handleDragOver(event, index)}
          onDrop={() => handleDrop(index)}
          onToggleVisibility={isHost ? onToggleVisibility : undefined}
          onDetach={isHost ? onDetach : undefined}
          onPlay={isHost ? onPlay : undefined}
          onPause={isHost ? onPause : undefined}
          onSeek={isHost ? onSeek : undefined}
          onVolumeChange={isHost ? onVolumeChange : undefined}
          onMutedChange={isHost ? onMutedChange : undefined}
        />
      ))}
    </div>
  )
}
