import { getLayoutMeta } from '@/lib/layouts'
import { backgroundShouldShow } from '@/lib/graphics'
import { PreviewParticipant } from '@/components/studio/preview/PreviewParticipant'
import { PreviewGraphicsLayer } from '@/components/studio/preview/PreviewGraphicsLayer'
import { PreviewCountdownLayer } from '@/components/studio/preview/PreviewCountdownLayer'
import type { CountdownState, LayoutType } from '@/types/session'
import type { StudioParticipant } from '@/types/participants'
import type { GraphicsState } from '@/types/graphics'
import { cn } from '@/lib/utils'

interface PreviewCanvasProps {
  layout: LayoutType
  participants: StudioParticipant[]
  graphics: GraphicsState | null
  countdownState?: CountdownState | null
}

/**
 * HTML preview canvas — approximates layout visually for WYSIWYG.
 * Actual positioning/scaling/cropping is handled by the compositor backend.
 */
export function PreviewCanvas({ layout, participants, graphics, countdownState }: PreviewCanvasProps) {
  const meta = getLayoutMeta(layout)
  const visible = participants.filter((p) => !p.isHidden)
  const host = visible.find((p) => p.isHost)
  const guests = visible.filter((p) => !p.isHost)

  const showBackground = backgroundShouldShow(graphics?.background ?? null, layout)
  // Inset camera tiles when background is active so margins show it (matches compositor BACKGROUND_TILE_INSET).
  const participantInset = showBackground

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-zinc-950 shadow-2xl ring-1 ring-border/40">
        <PreviewGraphicsLayer layout={layout} graphics={graphics} variant="background" />

        <div
          className={cn(
            'absolute inset-0 z-[5]',
            meta.previewClass,
            participantInset && 'p-[3%]',
          )}
        >
          {layout === 'FULLSCREEN' && host && (
            <PreviewParticipant participant={host} className="h-full w-full" />
          )}

          {(layout === 'CONTAIN' || layout === 'COVER' || layout === 'GRID') && (
            <div className="grid h-full w-full grid-cols-2 gap-0.5 p-0.5">
              {visible.map((p) => (
                <PreviewParticipant key={p.peerId} participant={p} className="min-h-0" />
              ))}
            </div>
          )}

          {(layout === 'SIDE_BY_SIDE' || layout === 'HALFSCREEN') && (
            <div className="flex h-full w-full gap-0.5 p-0.5">
              {visible.slice(0, 2).map((p) => (
                <PreviewParticipant key={p.peerId} participant={p} className="flex-1" />
              ))}
            </div>
          )}

          {layout === 'SPOTLIGHT' && (
            <div className="flex h-full w-full gap-0.5 p-0.5">
              {host && <PreviewParticipant participant={host} className="flex-[3]" />}
              {guests.length > 0 && (
                <div className="flex flex-[1] flex-col gap-0.5">
                  {guests.slice(0, 3).map((p) => (
                    <PreviewParticipant key={p.peerId} participant={p} className="flex-1" />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === 'THUMBNAIL' && (
            <div className="flex h-full w-full flex-col gap-0.5 p-0.5">
              {host && <PreviewParticipant participant={host} className="flex-[3]" />}
              {guests.length > 0 && (
                <div className="flex flex-[1] gap-0.5">
                  {guests.slice(0, 4).map((p) => (
                    <PreviewParticipant key={p.peerId} participant={p} className="flex-1" />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === 'CINEMA' && (
            <div className="flex h-full w-full flex-col gap-0.5 p-0.5">
              {host && <PreviewParticipant participant={host} className="flex-[4]" />}
              {guests.length > 0 && (
                <div className="flex flex-[1] gap-0.5 overflow-x-auto">
                  {guests.map((p) => (
                    <PreviewParticipant key={p.peerId} participant={p} className="min-w-[30%] flex-1" />
                  ))}
                </div>
              )}
            </div>
          )}

          {(layout === 'PICTURE_IN_PICTURE' || layout === 'OVERLAY') && (
            <div className="relative h-full w-full">
              {host && <PreviewParticipant participant={host} className="h-full w-full" />}
              {guests.length > 0 && (
                <PreviewParticipant
                  participant={guests[0]}
                  className="absolute bottom-3 right-3 h-[25%] w-[35%] rounded-lg shadow-lg ring-2 ring-white/20"
                />
              )}
            </div>
          )}
        </div>

        <PreviewGraphicsLayer layout={layout} graphics={graphics} variant="overlay" />
        <PreviewCountdownLayer countdownState={countdownState ?? null} />

        <div className="absolute left-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">
          {meta.label}
        </div>
      </div>
    </div>
  )
}
