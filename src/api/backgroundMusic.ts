import { apiRequest } from '@/api/client'
import { updateScene } from '@/api/scenes'
import { backgroundMusicErrorMessage, presetToTrack } from '@/lib/backgroundMusic'
import type { BackgroundMusicPreset } from '@/lib/backgroundMusicPresets'
import type {
  BackgroundMusicCommandAck,
  BackgroundMusicRejectionReason,
} from '@/types/backgroundMusic'
import type { BackgroundMusicConfig } from '@/types/scenes'

const TRANSPORT_ENDPOINT = (sessionId: string, sceneId: string, action: string) =>
  `/sessions/${sessionId}/scenes/${sceneId}/background-music/${action}/`

function buildRejectionAck(
  sceneId: string,
  rejectionReason: BackgroundMusicRejectionReason,
): BackgroundMusicCommandAck {
  return {
    accepted: false,
    rejection_reason: rejectionReason,
    state: {
      scene_id: sceneId,
      playback_state: 'error',
      position_ms: 0,
      duration_ms: 0,
      error: {
        code: rejectionReason,
        message: backgroundMusicErrorMessage(rejectionReason),
      },
      updated_at: new Date().toISOString(),
    },
  }
}

export async function updateSceneBackgroundMusic(
  sessionId: string,
  sceneId: string,
  config: Partial<BackgroundMusicConfig>,
): Promise<BackgroundMusicConfig> {
  const scene = await updateScene(sessionId, sceneId, { background_music: config })
  return scene.background_music
}

export async function selectBackgroundMusicPreset(
  sessionId: string,
  sceneId: string,
  preset: BackgroundMusicPreset,
  current: BackgroundMusicConfig,
): Promise<BackgroundMusicConfig> {
  return updateSceneBackgroundMusic(sessionId, sceneId, {
    ...current,
    enabled: true,
    track: presetToTrack(preset),
  })
}

export async function removeBackgroundMusic(
  sessionId: string,
  sceneId: string,
): Promise<BackgroundMusicConfig> {
  return updateSceneBackgroundMusic(sessionId, sceneId, {
    version: 1,
    enabled: false,
    track: null,
    muted: false,
  })
}

export async function playBackgroundMusic(
  sessionId: string,
  sceneId: string,
  activeSceneId: string | null,
  config: BackgroundMusicConfig,
): Promise<BackgroundMusicCommandAck> {
  if (sceneId !== activeSceneId) {
    return buildRejectionAck(sceneId, 'scene_not_active')
  }
  if (!config.track) {
    return buildRejectionAck(sceneId, 'no_track_loaded')
  }

  return apiRequest<BackgroundMusicCommandAck>(TRANSPORT_ENDPOINT(sessionId, sceneId, 'play'), {
    method: 'POST',
  })
}

export async function pauseBackgroundMusic(
  sessionId: string,
  sceneId: string,
): Promise<BackgroundMusicCommandAck> {
  return apiRequest<BackgroundMusicCommandAck>(TRANSPORT_ENDPOINT(sessionId, sceneId, 'pause'), {
    method: 'POST',
  })
}

export async function resumeBackgroundMusic(
  sessionId: string,
  sceneId: string,
): Promise<BackgroundMusicCommandAck> {
  return apiRequest<BackgroundMusicCommandAck>(TRANSPORT_ENDPOINT(sessionId, sceneId, 'resume'), {
    method: 'POST',
  })
}

export async function stopBackgroundMusic(
  sessionId: string,
  sceneId: string,
): Promise<BackgroundMusicCommandAck> {
  return apiRequest<BackgroundMusicCommandAck>(TRANSPORT_ENDPOINT(sessionId, sceneId, 'stop'), {
    method: 'POST',
  })
}

export async function setBackgroundMusicVolume(
  sessionId: string,
  sceneId: string,
  params: { volume: number; muted?: boolean },
): Promise<BackgroundMusicCommandAck> {
  return apiRequest<BackgroundMusicCommandAck>(TRANSPORT_ENDPOINT(sessionId, sceneId, 'volume'), {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/** @deprecated v1 — use preset catalog instead */
export async function uploadBackgroundMusic(): Promise<never> {
  throw new Error('Upload is not available yet. Select a preset track instead.')
}

/** @deprecated v1 — use selectBackgroundMusicPreset instead */
export async function replaceBackgroundMusic(): Promise<never> {
  throw new Error('Replace via upload is not available yet. Select a preset track instead.')
}
