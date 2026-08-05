import {
  getContainGridDimensions,
  getFixedGridDimensions,
  getLayoutMeta,
  getPreviewVideoFit,
} from '@/lib/layouts'
import { backgroundShouldShow } from '@/lib/graphics'
import { PreviewParticipant } from '@/components/studio/preview/PreviewParticipant'
import { PreviewGraphicsLayer } from '@/components/studio/preview/PreviewGraphicsLayer'
import { PreviewCountdownLayer } from '@/components/studio/preview/PreviewCountdownLayer'
import {
  BackgroundMusicIndicator,
  type PreviewBackgroundMusicState,
} from '@/components/studio/preview/BackgroundMusicIndicator'
import type { CountdownState, LayoutType } from '@/types/session'
import type { StudioParticipant } from '@/types/participants'
import type { GraphicsState } from '@/types/graphics'
import { cn } from '@/lib/utils'

interface PreviewCanvasProps {
  layout: LayoutType
  participants: StudioParticipant[]
  graphics: GraphicsState | null
  countdownState?: CountdownState | null
  backgroundMusic?: PreviewBackgroundMusicState | null
}

/**
 * HTML preview canvas — approximates layout visually for WYSIWYG.
 * Actual positioning/scaling/cropping is handled by the compositor backend.
 */
export function PreviewCanvas({
  layout,
  participants,
  graphics,
  countdownState,
  backgroundMusic,
}: PreviewCanvasProps) {
  const meta = getLayoutMeta(layout)
  const visible = participants.filter((p) => !p.isHidden)
  const maxTiles = layout === 'GRID' ? 9 : visible.length
  const tiles = visible.slice(0, maxTiles)
  const primary = tiles[0]
  const others = tiles.slice(1)

  const showBackground = backgroundShouldShow(graphics?.background ?? null, layout)
  // Inset camera tiles when background is active so margins show it (matches compositor BACKGROUND_TILE_INSET).
  const participantInset = showBackground
  const videoFit = getPreviewVideoFit(layout)
  const containGrid = getContainGridDimensions(Math.max(tiles.length, 1))
  const fixedGrid = getFixedGridDimensions(Math.max(tiles.length, 1))

  return (
    <div className="relative mx-auto w-full max-w-4xl px-0 sm:px-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-zinc-950 shadow-2xl ring-1 ring-border/40">
        <PreviewGraphicsLayer layout={layout} graphics={graphics} variant="background" />

        <div
          className={cn(
            'absolute inset-0 z-[5]',
            meta.previewClass,
            participantInset && 'p-[3%]',
          )}
        >
          {layout === 'FULLSCREEN' && primary && (
            <PreviewParticipant participant={primary} className="h-full w-full" videoFit={videoFit} />
          )}

          {(layout === 'CONTAIN' || layout === 'COVER') && (
            <div
              className={cn(
                'grid h-full w-full',
                participantInset && layout === 'CONTAIN' ? 'gap-[1.25%]' : 'gap-0.5 p-0.5',
              )}
              style={{
                gridTemplateColumns: `repeat(${containGrid.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${containGrid.rows}, minmax(0, 1fr))`,
              }}
            >
              {tiles.map((p) => (
                <PreviewParticipant
                  key={p.peerId}
                  participant={p}
                  className="min-h-0"
                  videoFit={videoFit}
                />
              ))}
            </div>
          )}

          {layout === 'GRID' && (
            <div
              className="grid h-full w-full gap-0.5 p-0.5"
              style={{
                gridTemplateColumns: `repeat(${fixedGrid.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${fixedGrid.rows}, minmax(0, 1fr))`,
              }}
            >
              {tiles.map((p, index) => (
                <PreviewParticipant
                  key={p.peerId}
                  participant={p}
                  className="min-h-0"
                  videoFit={videoFit}
                  style={{
                    gridColumn: (index % fixedGrid.columns) + 1,
                    gridRow: Math.floor(index / fixedGrid.columns) + 1,
                  }}
                />
              ))}
            </div>
          )}

          {(layout === 'SIDE_BY_SIDE' || layout === 'HALFSCREEN') && (
            <div className="flex h-full w-full gap-0.5 p-0.5">
              {tiles.slice(0, 2).map((p) => (
                <PreviewParticipant key={p.peerId} participant={p} className="flex-1" videoFit={videoFit} />
              ))}
            </div>
          )}

          {layout === 'SPOTLIGHT' && (
            others.length === 0 && primary ? (
              <PreviewParticipant participant={primary} className="h-full w-full" videoFit={videoFit} />
            ) : (
              <div className="flex h-full w-full gap-0.5 p-0.5">
                {primary && (
                  <PreviewParticipant participant={primary} className="w-[70%] shrink-0" videoFit={videoFit} />
                )}
                {others.length > 0 && (
                  <div className="flex w-[30%] shrink-0 flex-col gap-0.5">
                    {others.slice(0, 3).map((p) => (
                      <PreviewParticipant key={p.peerId} participant={p} className="flex-1" videoFit={videoFit} />
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {layout === 'THUMBNAIL' && (
            <div className="flex h-full w-full flex-col gap-0.5 p-0.5">
              {primary && <PreviewParticipant participant={primary} className="flex-[3]" videoFit={videoFit} />}
              {others.length > 0 && (
                <div className="flex flex-[1] gap-0.5">
                  {others.slice(0, 4).map((p) => (
                    <PreviewParticipant key={p.peerId} participant={p} className="flex-1" videoFit={videoFit} />
                  ))}
                </div>
              )}
            </div>
          )}

          {layout === 'CINEMA' && (
            <div className="flex h-full w-full flex-col gap-0.5 p-0.5">
              {primary && <PreviewParticipant participant={primary} className="flex-[4]" videoFit={videoFit} />}
              {others.length > 0 && (
                <div className="flex flex-1 gap-0.5 overflow-x-auto">
                  {others.map((p) => (
                    <PreviewParticipant
                      key={p.peerId}
                      participant={p}
                      className="min-w-[30%] flex-1"
                      videoFit={videoFit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(layout === 'PICTURE_IN_PICTURE' || layout === 'OVERLAY') && (
            <div className="relative h-full w-full">
              {primary && (
                <PreviewParticipant participant={primary} className="h-full w-full" videoFit={videoFit} />
              )}
              {others.length > 0 && (
                <PreviewParticipant
                  participant={others[0]}
                  className="absolute bottom-3 right-3 h-[25%] w-[35%] rounded-lg shadow-lg ring-2 ring-white/20"
                  videoFit={videoFit}
                />
              )}
            </div>
          )}
        </div>

        <PreviewGraphicsLayer layout={layout} graphics={graphics} variant="overlay" />
        <PreviewCountdownLayer countdownState={countdownState ?? null} />
        <BackgroundMusicIndicator backgroundMusic={backgroundMusic ?? null} />

        <div className="absolute left-2 top-2 z-20 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">
          {meta.label}
        </div>
      </div>
    </div>
  )
}
