import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  activateScene as activateSceneApi,
  createScene,
  deleteScene,
  listScenes,
  updateScene,
} from '@/api/scenes'
import { ApiError } from '@/api/client'
import type { DeviceSelection } from '@/types/devices'
import type { Scene, SceneActivateResponse } from '@/types/scenes'
import type { CountdownState } from '@/types/session'

const SCENES_POLL_MS = 3000

function toSceneDevicesPayload(devices: DeviceSelection) {
  return {
    cameraId: devices.cameraId,
    microphoneId: devices.microphoneId,
    speakerId: devices.speakerId,
  }
}

export function useSceneStore(
  sessionId: string,
  isHost: boolean,
  onCountdownState?: (state: CountdownState | null) => void,
) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const scenesRef = useRef(scenes)
  scenesRef.current = scenes

  const refresh = useCallback(async (): Promise<Scene[]> => {
    if (!sessionId) return []
    setIsLoading(true)
    try {
      const list = await listScenes(sessionId)
      setScenes(list)
      const active = list.find((s) => s.is_active)
      setActiveSceneId(active?.scene_id ?? null)
      return list
    } catch (err) {
      if (err instanceof ApiError && isHost) toast.error(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isHost])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), SCENES_POLL_MS)
    return () => window.clearInterval(interval)
  }, [refresh])

  const saveSceneDevices = useCallback(
    async (sceneId: string, devices: DeviceSelection) => {
      if (!isHost || !sessionId) return null
      try {
        const updated = await updateScene(sessionId, sceneId, {
          devices: toSceneDevicesPayload(devices),
        })
        setScenes((prev) => prev.map((s) => (s.scene_id === sceneId ? updated : s)))
        return updated
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to save scene devices'
        toast.error(msg)
        return null
      }
    },
    [isHost, sessionId],
  )

  const saveActiveSceneDevices = useCallback(
    async (devices: DeviceSelection) => {
      const list = scenesRef.current.length > 0 ? scenesRef.current : await refresh()
      const active = list.find((s) => s.is_active)
      if (!active) return null
      return saveSceneDevices(active.scene_id, devices)
    },
    [refresh, saveSceneDevices],
  )

  const addCameraScene = useCallback(
    async (devices: DeviceSelection) => {
      if (!isHost || !sessionId) return null
      setIsMutating(true)
      try {
        const scene = await createScene(sessionId, {
          type: 'CAMERA',
          devices: toSceneDevicesPayload(devices),
        })
        const list = await refresh()
        toast.success(`Created ${scene.name}`)
        const activeScene = list.find((s) => s.is_active) ?? null
        return { created: scene, activeScene }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to create scene'
        toast.error(msg)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, refresh],
  )

  const addCountdownScene = useCallback(
    async (durationSeconds: number, targetSceneId: string) => {
      if (!isHost || !sessionId) return null
      setIsMutating(true)
      try {
        const scene = await createScene(sessionId, {
          type: 'COUNTDOWN',
          duration_seconds: durationSeconds,
          target_scene_id: targetSceneId,
        })
        await refresh()
        toast.success(`Created ${scene.name}`)
        return scene
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to create countdown scene'
        toast.error(msg)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, refresh],
  )

  const renameScene = useCallback(
    async (sceneId: string, name: string) => {
      if (!isHost || !sessionId) return
      const trimmed = name.trim()
      if (!trimmed) return

      const previous = scenesRef.current
      setScenes((prev) =>
        prev.map((s) => (s.scene_id === sceneId ? { ...s, name: trimmed } : s)),
      )

      try {
        const updated = await updateScene(sessionId, sceneId, { name: trimmed })
        setScenes((prev) =>
          prev.map((s) => (s.scene_id === sceneId ? updated : s)),
        )
      } catch (err) {
        setScenes(previous)
        const msg = err instanceof ApiError ? err.message : 'Failed to rename scene'
        toast.error(msg)
      }
    },
    [isHost, sessionId],
  )

  const removeScene = useCallback(
    async (sceneId: string) => {
      if (!isHost || !sessionId) return false
      setIsMutating(true)
      try {
        await deleteScene(sessionId, sceneId)
        setScenes((prev) => prev.filter((s) => s.scene_id !== sceneId))
        toast.success('Scene deleted')
        return true
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to delete scene'
        toast.error(msg)
        return false
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId],
  )

  const activateScene = useCallback(
    async (sceneId: string): Promise<SceneActivateResponse | null> => {
      if (!isHost || !sessionId) return null

      setIsMutating(true)
      try {
        const result = await activateSceneApi(sessionId, sceneId)

        if (result.activation_type === 'countdown') {
          onCountdownState?.(result.countdown_state)
          toast.success('Countdown started')
          return result
        }

        if (activeSceneId === sceneId) return result

        setScenes((prev) =>
          prev.map((s) => ({
            ...s,
            is_active: s.scene_id === sceneId,
          })),
        )
        setActiveSceneId(sceneId)
        onCountdownState?.(null)
        toast.success(`Switched to ${result.scene.name}`)
        return result
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to activate scene'
        toast.error(msg)
        return null
      } finally {
        setIsMutating(false)
      }
    },
    [isHost, sessionId, activeSceneId, onCountdownState],
  )

  const patchActiveSceneSources = useCallback((assignments: Record<string, string>) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.is_active
          ? {
              ...scene,
              sources: {
                ...scene.sources,
                assignments,
              },
            }
          : scene,
      ),
    )
  }, [])

  const patchScene = useCallback((updated: Scene) => {
    setScenes((prev) => prev.map((scene) => (scene.scene_id === updated.scene_id ? updated : scene)))
  }, [])

  return {
    scenes,
    activeSceneId,
    isLoading,
    isMutating,
    refresh,
    saveSceneDevices,
    saveActiveSceneDevices,
    addCameraScene,
    addCountdownScene,
    renameScene,
    removeScene,
    activateScene,
    patchActiveSceneSources,
    patchScene,
  }
}

export type SceneStore = ReturnType<typeof useSceneStore>
