import { useCallback, useEffect, useRef, useState } from 'react'
import type { BackgroundMusicRuntimeState } from '@/types/backgroundMusic'
import type { BackgroundMusicConfig } from '@/types/scenes'

function createIdleRuntime(sceneId: string | null = null): BackgroundMusicRuntimeState {
  return {
    scene_id: sceneId,
    playback_state: 'idle',
    position_ms: 0,
    duration_ms: 0,
    error: null,
    updated_at: new Date().toISOString(),
  }
}

function runtimeFromAudio(
  audio: HTMLAudioElement,
  sceneId: string | null,
): BackgroundMusicRuntimeState {
  let playback_state: BackgroundMusicRuntimeState['playback_state'] = 'idle'
  if (audio.error) {
    playback_state = 'error'
  } else if (audio.ended) {
    playback_state = 'stopped'
  } else if (audio.paused) {
    playback_state = audio.currentTime > 0 ? 'paused' : 'ready'
  } else if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
    playback_state = 'loading'
  } else {
    playback_state = 'playing'
  }

  return {
    scene_id: sceneId,
    playback_state,
    position_ms: Math.max(0, Math.round(audio.currentTime * 1000)),
    duration_ms: Number.isFinite(audio.duration)
      ? Math.max(0, Math.round(audio.duration * 1000))
      : 0,
    error: audio.error
      ? {
          code: 'decode_failed',
          message: audio.error.message || 'Could not play this track in the browser.',
        }
      : null,
    updated_at: new Date().toISOString(),
  }
}

export interface UseBrowserBackgroundMusicOptions {
  enabled: boolean
  sceneId: string | null
}

export function useBrowserBackgroundMusic({ enabled, sceneId }: UseBrowserBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sceneIdRef = useRef(sceneId)
  const [runtime, setRuntime] = useState<BackgroundMusicRuntimeState>(() =>
    createIdleRuntime(sceneId),
  )

  sceneIdRef.current = sceneId

  const publishRuntime = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      setRuntime(createIdleRuntime(sceneIdRef.current))
      return
    }
    setRuntime(runtimeFromAudio(audio, sceneIdRef.current))
  }, [])

  useEffect(() => {
    if (!enabled) {
      setRuntime(createIdleRuntime(sceneId))
      return
    }

    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio

    const onUpdate = () => publishRuntime()
    audio.addEventListener('timeupdate', onUpdate)
    audio.addEventListener('loadedmetadata', onUpdate)
    audio.addEventListener('playing', onUpdate)
    audio.addEventListener('pause', onUpdate)
    audio.addEventListener('waiting', onUpdate)
    audio.addEventListener('ended', onUpdate)
    audio.addEventListener('error', onUpdate)

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
      setRuntime(createIdleRuntime(sceneIdRef.current))
    }
  }, [enabled, publishRuntime])

  useEffect(() => {
    setRuntime((current) => ({ ...current, scene_id: sceneId }))
  }, [sceneId])

  const applyAudioSettings = useCallback((config: BackgroundMusicConfig) => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = config.loop
    audio.volume = config.muted ? 0 : config.volume
    audio.muted = config.muted
  }, [])

  const loadFromConfig = useCallback(
    async (config: BackgroundMusicConfig, { autoPlay = false }: { autoPlay?: boolean } = {}) => {
      const audio = audioRef.current
      if (!audio) return

      const url = config.track?.url
      if (!url) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        setRuntime(createIdleRuntime(sceneIdRef.current))
        return
      }

      applyAudioSettings(config)

      const sameSource = audio.src === url || audio.src.endsWith(url)
      if (!sameSource) {
        audio.src = url
        audio.load()
        setRuntime({
          ...createIdleRuntime(sceneIdRef.current),
          playback_state: 'loading',
        })
      }

      if (autoPlay) {
        audio.currentTime = 0
        try {
          await audio.play()
        } catch (err) {
          setRuntime({
            ...runtimeFromAudio(audio, sceneIdRef.current),
            playback_state: 'error',
            error: {
              code: 'decode_failed',
              message:
                err instanceof Error ? err.message : 'Could not start preview playback.',
            },
          })
        }
      } else {
        publishRuntime()
      }
    },
    [applyAudioSettings, publishRuntime],
  )

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio?.src) return
    audio.currentTime = 0
    try {
      await audio.play()
    } catch (err) {
      setRuntime({
        ...runtimeFromAudio(audio, sceneIdRef.current),
        playback_state: 'error',
        error: {
          code: 'decode_failed',
          message: err instanceof Error ? err.message : 'Could not start preview playback.',
        },
      })
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    publishRuntime()
  }, [publishRuntime])

  const resume = useCallback(async () => {
    await play()
  }, [play])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    publishRuntime()
  }, [publishRuntime])

  const unload = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    setRuntime(createIdleRuntime(sceneIdRef.current))
  }, [])

  const setVolume = useCallback(
    (volume: number, muted?: boolean) => {
      const audio = audioRef.current
      if (!audio) return
      const isMuted = muted ?? audio.muted
      audio.muted = isMuted
      audio.volume = isMuted ? 0 : volume
      publishRuntime()
    },
    [publishRuntime],
  )

  return {
    runtime,
    loadFromConfig,
    play,
    pause,
    resume,
    stop,
    unload,
    setVolume,
  }
}
