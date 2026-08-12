import type { SourceType } from '@/types/participants'
import { Camera, Monitor, Film, Radio, Image, Music, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export const SOURCE_TYPES: SourceType[] = [
  { id: 'camera', label: 'Camera', icon: 'camera', enabled: true, category: 'camera' },
  { id: 'screen', label: 'Screen Share', icon: 'monitor', enabled: true, category: 'screen' },
  { id: 'prerecorded', label: 'Pre-recorded Video', icon: 'film', enabled: true, category: 'media' },
  { id: 'rtmp', label: 'RTMP', icon: 'radio', enabled: false, category: 'external' },
  { id: 'image', label: 'Image', icon: 'image', enabled: false, category: 'media' },
  { id: 'audio', label: 'Audio', icon: 'music', enabled: false, category: 'media' },
  { id: 'pdf', label: 'PDF', icon: 'file', enabled: false, category: 'media' },
]

const ICON_MAP: Record<string, typeof Camera> = {
  camera: Camera,
  monitor: Monitor,
  film: Film,
  radio: Radio,
  image: Image,
  music: Music,
  file: FileText,
}

interface SourceCardProps {
  source: SourceType
  onAdd?: (sourceId: string) => void
}

export function SourceCard({ source, onAdd }: SourceCardProps) {
  const Icon = ICON_MAP[source.icon] ?? Camera

  return (
    <button
      type="button"
      disabled={!source.enabled}
      onClick={() => onAdd?.(source.id)}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
        source.enabled
          ? 'border-border/60 hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
          : 'border-border/30 opacity-40 cursor-not-allowed',
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-[11px] font-medium leading-tight">{source.label}</span>
      {!source.enabled && (
        <span className="text-[9px] text-muted-foreground">Coming soon</span>
      )}
    </button>
  )
}
