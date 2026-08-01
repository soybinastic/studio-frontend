import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  removeBackgroundMusic,
  selectBackgroundMusicPreset,
  updateSceneBackgroundMusic,
} from '@/api/backgroundMusic'
import {
  mirrorCompositorPause,
  mirrorCompositorPlay,
  mirrorCompositorPlayAndWait,
  mirrorCompositorResume,
  mirrorCompositorStop,
  mirrorCompositorVolume,
} from '@/api/backgroundMusicCompositor'
import { useBrowserBackgroundMusic } from '@/hooks/useBrowserBackgroundMusic'
import { normalizeBackgroundMusicConfig } from '@/lib/backgroundMusic'
import { persistBackgroundMusic } from '@/lib/persistenceSync'
import type { BackgroundMusicPreset } from '@/lib/backgroundMusicPresets'
import type { BackgroundMusicRuntimeState } from '@/types/backgroundMusic'
import type { BackgroundMusicConfig, Scene } from '@/types/scenes'
import { ApiError } from '@/api/client'

interface UseBackgroundMusicStoreOptions {
  sessionId: string
  isHost: boolean
  activeSceneId: string | null
  scenes: Scene[]
  onSceneUpdated?: (scene: Scene) => void
}

export function useBackgroundMusicStore({
  sessionId,
  isHost,
  activeSceneId,
  scenes,
  onSceneUpdated,
}: UseBackgroundMusicStoreOptions) {
  const activeScene = useMemo(
    () => scenes.find((scene) => scene.scene_id === activeSceneId) ?? null,
    [scenes, activeSceneId],
  )

  const [config, setConfig] = useState<BackgroundMusicConfig>(() =>
    normalizeBackgroundMusicConfig(activeScene?.background_music),
  )
  const [isMutating, setIsMutating] = useState(false)

  const configRef = useRef(config)
  configRef.current = config

  const browser = useBrowserBackgroundMusic({
    enabled: isHost,
    sceneId: activeSceneId,
  })

  const runtime: BackgroundMusicRuntimeState = isHost
    ? browser.runtime
    : {
        scene_id: activeSceneId,
        playback_state: config.track ? 'ready' : 'idle',
        position_ms: 0,
        duration_ms: 0,
        error: null,
        updated_at: new Date().toISOString(),
      }

  const syncBrowserFromConfig = useCallback(
    async (nextConfig: BackgroundMusicConfig, autoPlay: boolean) => {
      if (!isHost) return
      await browser.loadFromConfig(nextConfig, { autoPlay })
    },
    [browser, isHost],
  )

  useEffect(() => {
    const nextConfig = normalizeBackgroundMusicConfig(activeScene?.background_music)
    setConfig(nextConfig)
    if (isHost) {
      void browser.loadFromConfig(nextConfig, { autoPlay: false })
    }
  }, [activeScene?.background_music, activeSceneId, isHost, browser.loadFromConfig])

  const applySceneConfig = useCallback(
    (sceneConfig: BackgroundMusicConfig | null | undefined) => {
      const nextConfig = normalizeBackgroundMusicConfig(sceneConfig)
      setConfig(nextConfig)
      if (!isHost || !sessionId || !activeSceneId) return

      void syncBrowserFromConfig(nextConfig, Boolean(nextConfig.track))
      if (nextConfig.track) {
        void mirrorCompositorPlayAndWait(sessionId, activeSceneId, activeSceneId, nextConfig)
      } else {
        browser.unload()
        mirrorCompositorStop(sessionId, activeSceneId)
      }
    },
    [isHost, sessionId, activeSceneId, syncBrowserFromConfig, browser],
  )

  const saveConfig = useCallback(
    async (partial: Partial<BackgroundMusicConfig>) => {
      if (!isHost || !sessionId || !activeSceneId) return null

      const nextConfig = normalizeBackgroundMusicConfig({
        ...configRef.current,
        ...partial,
      })

      setConfig(nextConfig)
      setIsMutating(true)

      try {
        const saved = await updateSceneBackgroundMusic(sessionId, activeSceneId, nextConfig)
        const normalized = normalizeBackgroundMusicConfig(saved)
        setConfig(normalized)
        onSceneUpdated?.({
          ...activeScene!,
          background_music: normalized,
        })
        void persistBackgroundMusic(sessionId, activeSceneId, normalized)
        return normalized
      } catch (err) {
        const previous = normalizeBackgroundMusicConfig(activeScene?.background_music)
        setConfig(previous)
        await syncBrowserFromConfig(previous, false)
        const msg = err instanceof ApiError ? err.message : 'Failed to save background music'
        toast.error(msg)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, activeScene, onSceneUpdated, syncBrowserFromConfig],
  )

  const selectPreset = useCallback(
    async (preset: BackgroundMusicPreset) => {
      if (!isHost || !sessionId || !activeSceneId) return null
      setIsMutating(true)
      try {
        const saved = await selectBackgroundMusicPreset(
          sessionId,
          activeSceneId,
          preset,
          configRef.current,
        )
        const normalized = normalizeBackgroundMusicConfig(saved)
        setConfig(normalized)
        await browser.loadFromConfig(normalized, { autoPlay: true })
        await mirrorCompositorPlayAndWait(sessionId, activeSceneId, activeSceneId, normalized)
        onSceneUpdated?.({
          ...activeScene!,
          background_music: normalized,
        })
        void persistBackgroundMusic(sessionId, activeSceneId, normalized)
        return normalized
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to select track'
        toast.error(msg)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, activeScene, onSceneUpdated, browser],
  )

  const removeTrack = useCallback(async () => {
    if (!isHost || !sessionId || !activeSceneId) return null
    setIsMutating(true)
    try {
      browser.unload()
      mirrorCompositorStop(sessionId, activeSceneId)
      const saved = await removeBackgroundMusic(sessionId, activeSceneId)
      const normalized = normalizeBackgroundMusicConfig(saved)
      setConfig(normalized)
      onSceneUpdated?.({
        ...activeScene!,
        background_music: normalized,
      })
      return normalized
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to remove track'
      toast.error(msg)
      return null
    } finally {
      setIsMutating(false)
    }
  }, [isHost, sessionId, activeSceneId, activeScene, onSceneUpdated, browser])

  const play = useCallback(async () => {
    if (!isHost || !sessionId || !activeSceneId) return
    await browser.play()
    mirrorCompositorPlay(sessionId, activeSceneId, activeSceneId, configRef.current)
  }, [isHost, sessionId, activeSceneId, browser])

  const pause = useCallback(async () => {
    if (!isHost || !sessionId || !activeSceneId) return
    browser.pause()
    mirrorCompositorPause(sessionId, activeSceneId)
  }, [isHost, sessionId, activeSceneId, browser])

  const resume = useCallback(async () => {
    if (!isHost || !sessionId || !activeSceneId) return
    await browser.resume()
    mirrorCompositorResume(sessionId, activeSceneId)
  }, [isHost, sessionId, activeSceneId, browser])

  const stop = useCallback(async () => {
    if (!isHost || !sessionId || !activeSceneId) return
    browser.stop()
    mirrorCompositorStop(sessionId, activeSceneId)
  }, [isHost, sessionId, activeSceneId, browser])

  const setVolume = useCallback(
    async (volume: number, muted?: boolean) => {
      if (!isHost || !sessionId || !activeSceneId) return null

      const nextConfig = normalizeBackgroundMusicConfig({
        ...configRef.current,
        volume,
        muted: muted ?? configRef.current.muted,
      })

      setConfig(nextConfig)
      browser.setVolume(nextConfig.volume, nextConfig.muted)
      mirrorCompositorVolume(sessionId, activeSceneId, {
        volume: nextConfig.volume,
        muted: nextConfig.muted,
      })

      try {
        const saved = await updateSceneBackgroundMusic(sessionId, activeSceneId, {
          volume: nextConfig.volume,
          muted: nextConfig.muted,
        })
        const normalized = normalizeBackgroundMusicConfig(saved)
        setConfig(normalized)
        onSceneUpdated?.({
          ...activeScene!,
          background_music: normalized,
        })
        void persistBackgroundMusic(sessionId, activeSceneId, normalized)
        return normalized
      } catch (err) {
        const previous = normalizeBackgroundMusicConfig(activeScene?.background_music)
        setConfig(previous)
        browser.setVolume(previous.volume, previous.muted)
        const msg = err instanceof ApiError ? err.message : 'Failed to update volume'
        toast.error(msg)
        return null
      }
    },
    [isHost, sessionId, activeSceneId, activeScene, onSceneUpdated, browser],
  )

  const setMuted = useCallback(
    async (muted: boolean) => {
      return setVolume(configRef.current.volume, muted)
    },
    [setVolume],
  )

  return {
    config,
    runtime,
    isMutating,
    activeSceneId,
    activeSceneName: activeScene?.name ?? null,
    applySceneConfig,
    selectPreset,
    removeTrack,
    play,
    pause,
    resume,
    stop,
    setVolume,
    setMuted,
    saveConfig,
  }
}

export type BackgroundMusicStore = ReturnType<typeof useBackgroundMusicStore>
