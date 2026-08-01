import { useCallback, useState } from 'react'

export type SceneViewMode = 'list' | 'card'

const STORAGE_KEY = 'studio-scenes-view-mode'

function readStoredMode(): SceneViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'card' ? 'card' : 'list'
  } catch {
    return 'list'
  }
}

export function useSceneViewPreference(isHost: boolean) {
  const [viewMode, setViewMode] = useState<SceneViewMode>(readStoredMode)

  const setViewModePersisted = useCallback(
    (mode: SceneViewMode) => {
      setViewMode(mode)
      if (!isHost) return
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // ignore storage failures
      }
    },
    [isHost],
  )

  return { viewMode, setViewMode: setViewModePersisted }
}
