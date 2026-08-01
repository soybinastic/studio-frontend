import type { ReactNode } from 'react'
import { Monitor, User, Users } from 'lucide-react'
import type { LayoutType } from '@/types/session'
import { cn } from '@/lib/utils'

interface LayoutPreviewMockProps {
  layout: LayoutType
  tone?: 'overlay' | 'panel'
  className?: string
}

function Tile({
  tone,
  className,
  children,
}: {
  tone: 'overlay' | 'panel'
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[2px]',
        tone === 'overlay' ? 'bg-white/25 backdrop-blur-[1px]' : 'bg-foreground/15',
        className,
      )}
    >
      {children}
    </div>
  )
}

function iconClass(tone: 'overlay' | 'panel') {
  return tone === 'overlay' ? 'text-white/90' : 'text-foreground/70'
}

function LayoutMock({ layout, tone }: { layout: LayoutType; tone: 'overlay' | 'panel' }) {
  const icon = iconClass(tone)
  const pad = tone === 'panel' ? 'p-0.5' : 'p-1.5'
  const gap = tone === 'panel' ? 'gap-px' : 'gap-0.5'

  switch (layout) {
    case 'SIDE_BY_SIDE':
    case 'HALFSCREEN':
      return (
        <div className={cn('flex h-full w-full', gap, pad)}>
          <Tile tone={tone} className="w-[32%]">
            <Users className={cn('h-2.5 w-2.5', icon)} strokeWidth={1.5} />
          </Tile>
          <Tile tone={tone} className="flex-1">
            <Monitor className={cn('h-2.5 w-2.5', icon)} strokeWidth={1.5} />
          </Tile>
        </div>
      )

    case 'SPOTLIGHT':
      return (
        <div className={cn('flex h-full w-full', gap, pad)}>
          <Tile tone={tone} className="flex-[3]">
            <User className={cn('h-2.5 w-2.5', icon)} strokeWidth={1.5} />
          </Tile>
          <div className={cn('flex flex-[1] flex-col', gap)}>
            <Tile tone={tone} className="flex-1" />
            <Tile tone={tone} className="flex-1" />
          </div>
        </div>
      )

    case 'GRID':
    case 'CONTAIN':
    case 'COVER':
      return (
        <div className={cn('grid h-full w-full grid-cols-2', gap, pad)}>
          <Tile tone={tone} />
          <Tile tone={tone} />
          <Tile tone={tone} />
          <Tile tone={tone} />
        </div>
      )

    case 'THUMBNAIL':
    case 'CINEMA':
      return (
        <div className={cn('flex h-full w-full flex-col', gap, pad)}>
          <Tile tone={tone} className="flex-[3]">
            <User className={cn('h-2 w-2', icon)} strokeWidth={1.5} />
          </Tile>
          <div className={cn('flex flex-[1]', gap)}>
            <Tile tone={tone} className="flex-1" />
            <Tile tone={tone} className="flex-1" />
          </div>
        </div>
      )

    case 'PICTURE_IN_PICTURE':
    case 'OVERLAY':
      return (
        <div className={cn('relative h-full w-full', pad)}>
          <Tile tone={tone} className="h-full w-full">
            <User className={cn('h-2.5 w-2.5', icon)} strokeWidth={1.5} />
          </Tile>
          <Tile tone={tone} className="absolute bottom-1 right-1 h-[30%] w-[34%]">
            <User className={cn('h-1.5 w-1.5', icon)} strokeWidth={1.5} />
          </Tile>
        </div>
      )

    case 'FULLSCREEN':
    default:
      return (
        <div className={cn('flex h-full w-full items-center justify-center', pad)}>
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              tone === 'overlay'
                ? 'h-7 w-7 bg-white/30 ring-1 ring-white/40'
                : 'h-5 w-5 bg-foreground/20 ring-1 ring-foreground/25',
            )}
          >
            <User
              className={cn(tone === 'overlay' ? 'h-3.5 w-3.5 text-white/95' : 'h-2.5 w-2.5', icon)}
              strokeWidth={1.5}
            />
          </div>
        </div>
      )
  }
}

export function LayoutPreviewMock({ layout, tone = 'panel', className }: LayoutPreviewMockProps) {
  return (
    <div className={cn('h-full w-full', className)}>
      <LayoutMock layout={layout} tone={tone} />
    </div>
  )
}
