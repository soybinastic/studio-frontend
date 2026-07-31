import {
  pauseBackgroundMusic,
  playBackgroundMusic,
  resumeBackgroundMusic,
  setBackgroundMusicVolume,
  stopBackgroundMusic,
} from '@/api/backgroundMusic'
import { backgroundMusicErrorMessage } from '@/lib/backgroundMusic'
import type { BackgroundMusicCommandAck } from '@/types/backgroundMusic'
import type { BackgroundMusicConfig } from '@/types/scenes'
import { ApiError } from '@/api/client'

const MIRROR_RETRY_MS = 600
const MIRROR_MAX_ATTEMPTS = 3

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function mirrorTransport(
  label: string,
  fn: () => Promise<BackgroundMusicCommandAck>,
): Promise<BackgroundMusicCommandAck | null> {
  let lastAck: BackgroundMusicCommandAck | null = null

  for (let attempt = 0; attempt < MIRROR_MAX_ATTEMPTS; attempt += 1) {
    try {
      const ack = await fn()
      lastAck = ack
      if (ack.accepted) {
        return ack
      }
      if (ack.rejection_reason !== 'no_track_loaded' && ack.rejection_reason !== 'playback_timeout') {
        console.warn(`Compositor ${label} rejected:`, ack.rejection_reason)
        return ack
      }
    } catch (err) {
      if (err instanceof ApiError) {
        console.warn(`Compositor ${label} failed (${err.status}):`, err.message)
      } else {
        console.warn(`Compositor ${label} failed:`, err)
      }
      return null
    }

    if (attempt + 1 < MIRROR_MAX_ATTEMPTS) {
      await sleep(MIRROR_RETRY_MS)
    }
  }

  if (lastAck && !lastAck.accepted && lastAck.rejection_reason) {
    console.warn(
      `Compositor ${label} rejected after retries:`,
      backgroundMusicErrorMessage(lastAck.rejection_reason),
    )
  }
  return lastAck
}

/** Best-effort compositor mirror — preview uses browser audio; logs failures for debugging. */
export function mirrorCompositorPlay(
  sessionId: string,
  sceneId: string,
  activeSceneId: string | null,
  config: BackgroundMusicConfig,
): void {
  void mirrorTransport('play', () =>
    playBackgroundMusic(sessionId, sceneId, activeSceneId, config),
  )
}

export function mirrorCompositorPause(sessionId: string, sceneId: string): void {
  void mirrorTransport('pause', () => pauseBackgroundMusic(sessionId, sceneId))
}

export function mirrorCompositorResume(sessionId: string, sceneId: string): void {
  void mirrorTransport('resume', () => resumeBackgroundMusic(sessionId, sceneId))
}

export function mirrorCompositorStop(sessionId: string, sceneId: string): void {
  void mirrorTransport('stop', () => stopBackgroundMusic(sessionId, sceneId))
}

export function mirrorCompositorVolume(
  sessionId: string,
  sceneId: string,
  params: { volume: number; muted?: boolean },
): void {
  void mirrorTransport('volume', () => setBackgroundMusicVolume(sessionId, sceneId, params))
}

export async function mirrorCompositorPlayAndWait(
  sessionId: string,
  sceneId: string,
  activeSceneId: string | null,
  config: BackgroundMusicConfig,
): Promise<BackgroundMusicCommandAck | null> {
  return mirrorTransport('play', () =>
    playBackgroundMusic(sessionId, sceneId, activeSceneId, config),
  )
}
