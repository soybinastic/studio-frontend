import type { DragEvent } from 'react'
import { Camera, Eye, EyeOff, Film, GripVertical, Monitor, Radio, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Source, SourceType } from '@/types/sources'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<SourceType, typeof Camera> = {
  camera: Camera,
  screen: Monitor,
  prerecorded: Film,
  rtmp: Radio,
  image: Film,
  audio: Film,
  pdf: Film,
}

const TYPE_LABEL: Record<SourceType, string> = {
  camera: 'Camera',
  screen: 'Screen',
  prerecorded: 'Video',
  rtmp: 'RTMP',
  image: 'Image',
  audio: 'Audio',
  pdf: 'PDF',
}

export interface SceneItemRow {
  itemId: string
  sourceId: string
  visible: boolean
  zIndex: number
  source?: Source
}

interface SceneItemCardProps {
  row: SceneItemRow
  sortable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  disabled?: boolean
  onDragHandleStart?: (event: DragEvent<HTMLDivElement>) => void
  onDragHandleEnd?: (event: DragEvent<HTMLDivElement>) => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  onDrop?: (event: DragEvent<HTMLDivElement>) => void
  onToggleVisibility?: (sourceId: string, visible: boolean) => void
  onDetach?: (sourceId: string) => void
}

export function SceneItemCard({
  row,
  sortable = false,
  isDragging = false,
  isDragOver = false,
  disabled = false,
  onDragHandleStart,
  onDragHandleEnd,
  onDragOver,
  onDrop,
  onToggleVisibility,
  onDetach,
}: SceneItemCardProps) {
  const type = row.source?.type ?? 'camera'
  const Icon = TYPE_ICON[type] ?? Camera
  const name = row.source?.name || row.sourceId
  const cameraSettings = row.source?.settings as
    | { deviceAvailable?: boolean; hostWebcamDuplicate?: boolean }
    | undefined
  const deviceUnavailable =
    type === 'camera' && cameraSettings?.deviceAvailable === false
  const hostWebcamDuplicate =
    type === 'camera' && cameraSettings?.hostWebcamDuplicate === true

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-background/60 p-2 transition-colors hover:bg-muted/50',
        (!row.visible || deviceUnavailable) && 'opacity-60',
        isDragOver && 'bg-primary/10 ring-1 ring-primary/40',
        isDragging && 'opacity-50',
      )}
      onDragOver={(event) => {
        if (!sortable) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        onDragOver?.(event)
      }}
      onDrop={(event) => {
        if (!sortable) return
        event.preventDefault()
        event.stopPropagation()
        onDrop?.(event)
      }}
    >
      <div
        role="button"
        tabIndex={sortable ? 0 : undefined}
        aria-label="Drag to reorder"
        draggable={sortable}
        className={cn(
          'flex shrink-0 touch-none select-none items-center self-stretch rounded px-0.5',
          sortable
            ? 'cursor-grab active:cursor-grabbing hover:bg-muted/60'
            : 'cursor-default opacity-30',
        )}
        onDragStart={(event) => {
          if (!sortable) return
          event.dataTransfer.setData('text/plain', row.sourceId)
          event.dataTransfer.effectAllowed = 'move'
          onDragHandleStart?.(event)
        }}
        onDragEnd={(event) => {
          if (!sortable) return
          onDragHandleEnd?.(event)
        }}
      >
        <GripVertical className="pointer-events-none h-4 w-4 text-muted-foreground/70" />
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{name}</span>
          <Badge variant="outline" className="px-1 py-0 text-[9px]">
            {TYPE_LABEL[type] ?? type}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {deviceUnavailable
            ? 'Device not available on this machine'
            : hostWebcamDuplicate
              ? 'Covered by main webcam'
              : row.visible
                ? `Order ${row.zIndex + 1}`
                : 'Hidden'}
        </p>
      </div>

      <div className="flex shrink-0 gap-0.5" draggable={false}>
        {onToggleVisibility && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled}
            onClick={() => onToggleVisibility(row.sourceId, !row.visible)}
            aria-label={row.visible ? 'Hide' : 'Show'}
          >
            {row.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
        )}
        {onDetach && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={disabled}
            onClick={() => onDetach(row.sourceId)}
            aria-label="Remove from scene"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
