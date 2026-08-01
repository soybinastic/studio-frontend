import { hasSceneDevices } from '@/lib/devices'
import { hasNonNullGraphicsLayers } from '@/lib/graphics'
import type { DeviceSelection } from '@/types/devices'
import type { GraphicsState } from '@/types/graphics'
import type { BackgroundMusicConfig, Scene } from '@/types/scenes'
import type { LayoutType } from '@/types/session'

interface ApplyActiveScenePreviewOptions {
  outputStore: { setLayout: (layout: LayoutType) => void }
  graphicsStore: { applyGraphics: (state: Partial<GraphicsState> | null) => void }
  backgroundMusicStore: { applySceneConfig: (config: BackgroundMusicConfig | null | undefined) => void }
  deviceStore: { setSelection: (selection: Partial<DeviceSelection>) => void }
  tenantDevices?: DeviceSelection | null
}

/** Sync preview UI from the active scene after persistence hydration. */
export function applyActiveScenePreviewState(
  scenes: Scene[],
  {
    outputStore,
    graphicsStore,
    backgroundMusicStore,
    deviceStore,
    tenantDevices,
  }: ApplyActiveScenePreviewOptions,
): void {
  const activeScene = scenes.find((scene) => scene.is_active)
  if (!activeScene) return

  if (activeScene.layout) {
    outputStore.setLayout(activeScene.layout)
  }

  if (hasNonNullGraphicsLayers(activeScene.graphics_config)) {
    graphicsStore.applyGraphics(activeScene.graphics_config)
  }

  backgroundMusicStore.applySceneConfig(activeScene.background_music)

  if (hasSceneDevices(activeScene.devices)) {
    deviceStore.setSelection(activeScene.devices)
  } else if (tenantDevices) {
    deviceStore.setSelection(tenantDevices)
  }
}
