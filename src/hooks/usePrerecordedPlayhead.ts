import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampPlaybackMs,
  durationMsFromSource,
  isPrerecordedPlaying,
} from '@/lib/prerecordedPlayback'
import type { Source } from '@/types/sources'

interface PlayheadAnchor {
  basePositionMs: number
  baseWallMs: number
  playing: boolean
}

/**
 * v1 local playhead: last seek/play anchor + wall clock while ACTIVE.
 * May drift vs decoder; good enough for scrubber until compositor telemetry.
 */
export function usePrerecordedPlayhead(source: Source) {
  const durationMs = durationMsFromSource(source)
  const [, setTick] = useState(0)
  const anchorRef = useRef<PlayheadAnchor>({
    basePositionMs: 0,
    baseWallMs: performance.now(),
    playing: isPrerecordedPlaying(source.state),
  })

  const readPosition = useCallback((): number => {
    const anchor = anchorRef.current
    let position = anchor.basePositionMs
    if (anchor.playing) {
      position += performance.now() - anchor.baseWallMs
    }
    if (durationMs > 0 && position >= durationMs) {
      // Looping sources wrap the estimate so the bar does not stick at 100%.
      position = position % durationMs
      anchor.basePositionMs = position
      anchor.baseWallMs = performance.now()
    }
    return clampPlaybackMs(position, durationMs)
  }, [durationMs])

  const syncFromState = useCallback(
    (playing: boolean) => {
      const anchor = anchorRef.current
      if (playing === anchor.playing) return
      if (!playing && anchor.playing) {
        anchor.basePositionMs = readPosition()
        anchor.playing = false
        return
      }
      if (playing && !anchor.playing) {
        anchor.baseWallMs = performance.now()
        anchor.playing = true
      }
    },
    [readPosition],
  )

  useEffect(() => {
    syncFromState(isPrerecordedPlaying(source.state))
  }, [source.state, syncFromState])

  useEffect(() => {
    if (!isPrerecordedPlaying(source.state)) return undefined
    const id = window.setInterval(() => setTick((n) => n + 1), 250)
    return () => window.clearInterval(id)
  }, [source.state])

  const markSeek = useCallback(
    (positionMs: number) => {
      const clamped = clampPlaybackMs(positionMs, durationMs)
      anchorRef.current.basePositionMs = clamped
      anchorRef.current.baseWallMs = performance.now()
      setTick((n) => n + 1)
    },
    [durationMs],
  )

  const markPlay = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor.playing) {
      anchor.baseWallMs = performance.now()
      anchor.playing = true
    }
    setTick((n) => n + 1)
  }, [])

  const markPause = useCallback(() => {
    const anchor = anchorRef.current
    if (anchor.playing) {
      anchor.basePositionMs = readPosition()
      anchor.playing = false
    }
    setTick((n) => n + 1)
  }, [readPosition])

  return {
    positionMs: readPosition(),
    durationMs,
    markSeek,
    markPlay,
    markPause,
  }
}
