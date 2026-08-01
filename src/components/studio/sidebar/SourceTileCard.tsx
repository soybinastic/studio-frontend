import type { DragEvent } from 'react'
import { Eye, EyeOff, GripVertical, Mic, MicOff, Pin, Radio, User, Video, VideoOff, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StudioTileSource } from '@/types/participants'
import { cn } from '@/lib/utils'

interface SourceTileCardProps {
  source: StudioTileSource
  sortable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onDragHandleStart?: (event: DragEvent<HTMLDivElement>) => void
  onDragHandleEnd?: (event: DragEvent<HTMLDivElement>) => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  onDrop?: (event: DragEvent<HTMLDivElement>) => void
  onPin?: (sourceId: string) => void
  onHide?: (sourceId: string) => void
  onMute?: (sourceId: string) => void
}

export function SourceTileCard({
  source,
  sortable = false,
  isDragging = false,
  isDragOver = false,
  onDragHandleStart,
  onDragHandleEnd,
  onDragOver,
  onDrop,
  onPin,
  onHide,
  onMute,
}: SourceTileCardProps) {
  const initials = source.displayName
    .replace(' (You)', '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-background/60 p-2 transition-colors hover:bg-muted/50',
        source.isSpeaking && 'ring-1 ring-primary/30 bg-primary/5',
        source.isPinned && 'ring-1 ring-primary/20',
        source.isHidden && 'opacity-60',
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
          event.dataTransfer.setData('text/plain', source.sourceId)
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

      <div className="relative shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {source.kind === 'rtmp' ? (
            <Radio className="h-4 w-4" />
          ) : initials ? (
            initials
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
        {source.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">
            {source.displayName.replace(' (You)', '')}
          </span>
          {source.isHost && (
            <Badge variant="secondary" className="px-1 py-0 text-[9px]">Host</Badge>
          )}
          {source.kind === 'rtmp' && (
            <Badge variant="outline" className="px-1 py-0 text-[9px]">RTMP</Badge>
          )}
          {source.isLocal && (
            <Badge variant="outline" className="px-1 py-0 text-[9px]">You</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {source.kind === 'participant' && (
            <>
              {source.audioEnabled ? (
                <Mic className="h-3 w-3" />
              ) : (
                <MicOff className="h-3 w-3 text-destructive" />
              )}
              {source.videoEnabled ? (
                <Video className="h-3 w-3" />
              ) : (
                <VideoOff className="h-3 w-3 text-destructive" />
              )}
              {source.connectionStatus === 'connected' ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-yellow-500" />
              )}
            </>
          )}
          <span className="text-[10px]">
            {source.isHidden ? 'Hidden' : `Slot ${source.slotIndex}`}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-0.5" draggable={false}>
        {onPin && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPin(source.sourceId)}
            aria-label={source.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={cn('h-3.5 w-3.5', source.isPinned && 'fill-current text-primary')} />
          </Button>
        )}
        {onMute && source.isLocal && source.kind === 'participant' && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMute(source.sourceId)}>
            {source.audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </Button>
        )}
        {onHide && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onHide(source.sourceId)}>
            {source.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  )
}
