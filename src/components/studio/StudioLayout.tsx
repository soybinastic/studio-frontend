import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { TopToolbar } from '@/components/studio/toolbar/TopToolbar'
import { MediaBar } from '@/components/studio/toolbar/MediaBar'
import { PreviewCanvas } from '@/components/studio/preview/PreviewCanvas'
import { LayoutPicker } from '@/components/studio/layout/LayoutPicker'
import { StudioSidebar } from '@/components/studio/sidebar/StudioSidebar'
import { ScenesSidebar } from '@/components/studio/scenes/ScenesSidebar'
import { AddSceneModal } from '@/components/studio/scenes/AddSceneModal'
import { CountdownConfigModal } from '@/components/studio/scenes/CountdownConfigModal'
import { SceneDevicePickerModal } from '@/components/studio/scenes/SceneDevicePickerModal'
import { DeviceSetupModal } from '@/components/studio/device-setup/DeviceSetupModal'
import { useDeviceStore } from '@/hooks/useDeviceStore'
import { hasSceneDevices } from '@/lib/devices'
import { countdownSecondsRemaining } from '@/lib/countdown'
import { useRoom } from '@/hooks/useRoom'
import { useBackendSync } from '@/hooks/useBackendSync'
import { useOutputStore } from '@/hooks/useOutputStore'
import { useTileOrderStore } from '@/hooks/useTileOrderStore'
import { useGraphicsStore } from '@/hooks/useGraphicsStore'
import { useBackgroundMusicStore } from '@/hooks/useBackgroundMusicStore'
import { useSceneStore } from '@/hooks/useSceneStore'
import { tileSourceToStudioParticipant } from '@/types/participants'
import { clearStudioContext } from '@/lib/studioContext'
import { endSession } from '@/api/sessions'
import type { StudioSessionContext } from '@/types/session'
import type { LayoutType } from '@/types/session'
import type { DeviceSelection } from '@/types/devices'

interface StudioLayoutProps {
  context: StudioSessionContext
  sessionId: string
}

export function StudioLayout({ context, sessionId }: StudioLayoutProps) {
  const navigate = useNavigate()
  const deviceStore = useDeviceStore()
  const [showDeviceSetup, setShowDeviceSetup] = useState(!deviceStore.isSetupComplete)
  const [showSceneDevicePicker, setShowSceneDevicePicker] = useState(false)
  const [showAddSceneModal, setShowAddSceneModal] = useState(false)
  const [showCountdownModal, setShowCountdownModal] = useState(false)
  const [roomEnabled, setRoomEnabled] = useState(false)

  const outputStore = useOutputStore({
    sessionId,
    isHost: context.isHost,
    initialLayout: context.layout,
  })
  const backendSync = useBackendSync(sessionId, context.isHost)
  const graphicsStore = useGraphicsStore(sessionId, context.isHost)
  const sceneStore = useSceneStore(sessionId, context.isHost, outputStore.setCountdownState)
  const backgroundMusicStore = useBackgroundMusicStore({
    sessionId,
    isHost: context.isHost,
    activeSceneId: sceneStore.activeSceneId,
    scenes: sceneStore.scenes,
    onSceneUpdated: sceneStore.patchScene,
  })
  const prevCountdownActive = useRef(false)

  const {
    connectionState,
    participants,
    error,
    micEnabled,
    webcamEnabled,
    toggleMic,
    toggleWebcam,
    publishProducers,
    switchDevices,
    leave,
  } = useRoom({
    roomId: context.roomId,
    peerId: context.peerId,
    displayName: context.displayName,
    mediasoupWsUrl: context.mediasoupWsUrl,
    enabled: roomEnabled,
    autoPublish: false,
    deviceSelection: deviceStore.isSetupComplete ? deviceStore.selection : null,
  })

  const hostPeerId = useMemo(() => {
    if (context.isHost) return context.peerId
    const hostParticipant = participants.find(
      (p) => !p.isLocal && p.displayName.includes(context.hostDisplayName),
    )
    return hostParticipant?.peerId ?? participants.find((p) => !p.isLocal)?.peerId ?? context.peerId
  }, [context, participants])

  const activeSceneSources = useMemo(
    () => sceneStore.scenes.find((scene) => scene.is_active)?.sources,
    [sceneStore.scenes],
  )

  const tileOrder = useTileOrderStore({
    sessionId,
    isHost: context.isHost,
    hostPeerId,
    participants,
    connectionState,
    roomId: context.roomId,
    activeSceneId: sceneStore.activeSceneId,
    sceneSourcesConfig: activeSceneSources,
    onSceneSourcesUpdated: sceneStore.patchActiveSceneSources,
  })

  const previewParticipants = useMemo(
    () => tileOrder.visibleTileSources.map(tileSourceToStudioParticipant),
    [tileOrder.visibleTileSources],
  )

  useEffect(() => {
    if (deviceStore.isSetupComplete && !showDeviceSetup) {
      void deviceStore.startPreview()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeviceConfirm = useCallback(async () => {
    const selection = { ...deviceStore.selection }
    deviceStore.completeSetup()
    setShowDeviceSetup(false)
    setRoomEnabled(true)
    deviceStore.stopPreview()

    if (context.isHost) {
      await sceneStore.saveActiveSceneDevices(selection)
    }
  }, [deviceStore, context.isHost, sceneStore])

  const applyLiveDevices = useCallback(
    async (devices: DeviceSelection) => {
      deviceStore.setSelection(devices)
      if (devices.cameraId || devices.microphoneId) {
        await switchDevices(devices)
      }
    },
    [deviceStore, switchDevices],
  )

  useEffect(() => {
    if (roomEnabled && connectionState === 'connected') {
      void publishProducers()
    }
  }, [roomEnabled, connectionState, publishProducers])

  const title = useMemo(
    () => (context.isHost ? 'Host studio' : `${context.hostDisplayName}'s studio`),
    [context],
  )

  const subtitle = useMemo(
    () =>
      `${tileOrder.visibleTileSources.length} source${tileOrder.visibleTileSources.length === 1 ? '' : 's'} · ${outputStore.layout}`,
    [tileOrder.visibleTileSources.length, outputStore.layout],
  )

  const handleLayoutChange = useCallback(
    async (layout: LayoutType) => {
      outputStore.setLayout(layout)
      await backendSync.syncLayout(layout)
      toast.success(`Layout: ${layout}`)
    },
    [outputStore, backendSync],
  )

  const handleActivateScene = useCallback(
    async (sceneId: string) => {
      const result = await sceneStore.activateScene(sceneId)
      if (!result) return

      if (result.activation_type === 'countdown') {
        outputStore.setCountdownState(result.countdown_state)
        return
      }

      outputStore.setCountdownState(null)
      outputStore.setLayout(result.layout)
      graphicsStore.applyGraphics(result.graphics_config)
      backgroundMusicStore.applySceneConfig(result.scene.background_music)

      if (hasSceneDevices(result.devices)) {
        await applyLiveDevices(result.devices)
      }
    },
    [sceneStore, outputStore, graphicsStore, backgroundMusicStore, applyLiveDevices],
  )

  useEffect(() => {
    const active = Boolean(outputStore.countdownState?.active)
    if (prevCountdownActive.current && !active) {
      void (async () => {
        const list = await sceneStore.refresh()
        const activeScene = list.find((s) => s.is_active)
        if (activeScene) {
          if (activeScene.layout) outputStore.setLayout(activeScene.layout)
          graphicsStore.applyGraphics(activeScene.graphics_config)
          backgroundMusicStore.applySceneConfig(activeScene.background_music)
          if (context.isHost && hasSceneDevices(activeScene.devices)) {
            await applyLiveDevices(activeScene.devices)
          }
        }
        await outputStore.refreshSession()
      })()
    }
    prevCountdownActive.current = active
  }, [
    outputStore.countdownState,
    sceneStore,
    outputStore,
    graphicsStore,
    backgroundMusicStore,
    context.isHost,
    applyLiveDevices,
  ])

  useEffect(() => {
    const state = outputStore.countdownState
    if (!state?.active) return

    const remainingMs = countdownSecondsRemaining(state) * 1000 + 500
    const timer = window.setTimeout(() => {
      void outputStore.refreshSession()
      void sceneStore.refresh()
    }, remainingMs)

    return () => window.clearTimeout(timer)
  }, [outputStore.countdownState, outputStore, sceneStore])

  const handleAddScene = useCallback(() => {
    if (!deviceStore.isSetupComplete || !deviceStore.selection.cameraId) {
      toast.warning('Select a default camera before adding a scene.')
      return
    }
    setShowAddSceneModal(true)
  }, [deviceStore.isSetupComplete, deviceStore.selection.cameraId])

  const handleChooseCameraScene = useCallback(() => {
    setShowAddSceneModal(false)
    setShowSceneDevicePicker(true)
  }, [])

  const handleChooseCountdownScene = useCallback(() => {
    const cameraScenes = sceneStore.scenes.filter((s) => s.type === 'CAMERA')
    if (cameraScenes.length === 0) {
      toast.warning('Create a camera scene first to use as the countdown target.')
      return
    }
    setShowAddSceneModal(false)
    setShowCountdownModal(true)
  }, [sceneStore.scenes])

  const handleSceneDevicesConfirm = useCallback(
    async (selection: DeviceSelection) => {
      setShowSceneDevicePicker(false)
      const result = await sceneStore.addCameraScene(selection)
      if (result?.activeScene && hasSceneDevices(result.activeScene.devices)) {
        await applyLiveDevices(result.activeScene.devices)
      }
    },
    [sceneStore, applyLiveDevices],
  )

  const handleCountdownSave = useCallback(
    async (durationSeconds: number, targetSceneId: string) => {
      const scene = await sceneStore.addCountdownScene(durationSeconds, targetSceneId)
      if (scene) setShowCountdownModal(false)
    },
    [sceneStore],
  )

  const cameraScenes = useMemo(
    () => sceneStore.scenes.filter((s) => s.type === 'CAMERA'),
    [sceneStore.scenes],
  )

  const handleRenameScene = useCallback(
    (sceneId: string, name: string) => {
      void sceneStore.renameScene(sceneId, name)
    },
    [sceneStore],
  )

  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      await sceneStore.removeScene(sceneId)
    },
    [sceneStore],
  )

  const handleStartRecording = useCallback(async () => {
    outputStore.setRecordingAction('starting')
    await backendSync.syncStartRecording()
    outputStore.setRecordingAction(null)
    await outputStore.refresh()
    toast.success('Recording started')
  }, [outputStore, backendSync])

  const handleStopRecording = useCallback(async () => {
    outputStore.setRecordingAction('stopping')
    await backendSync.syncStopRecording()
    outputStore.setRecordingAction(null)
    await outputStore.refresh()
    toast.success('Recording stopped')
  }, [outputStore, backendSync])

  const handleStartStream = useCallback(
    async (type: 'RTMP' | 'HLS', destinations?: Parameters<typeof backendSync.syncStartStreaming>[1]) => {
      outputStore.setStreamingAction('starting')
      await backendSync.syncStartStreaming(type, destinations)
      outputStore.setStreamingAction(null)
      await outputStore.refresh()
    },
    [outputStore, backendSync],
  )

  const handleStopStream = useCallback(async () => {
    outputStore.setStreamingAction('stopping')
    await backendSync.syncStopStreaming()
    outputStore.setStreamingAction(null)
    await outputStore.refresh()
    toast.success('Stream stopped')
  }, [outputStore, backendSync])

  const handleLeave = useCallback(() => {
    leave()
    clearStudioContext()
    navigate(context.isHost ? '/' : '/')
  }, [leave, navigate, context.isHost])

  const handleEndSession = useCallback(async () => {
    await endSession(sessionId)
    leave()
    clearStudioContext()
    navigate('/')
  }, [sessionId, leave, navigate])

  const previewBackgroundMusic = useMemo(
    () => ({
      hasTrack: Boolean(backgroundMusicStore.config.track),
      trackTitle: backgroundMusicStore.config.track?.title ?? null,
      playbackState: backgroundMusicStore.runtime.playback_state,
      muted: backgroundMusicStore.config.muted,
    }),
    [
      backgroundMusicStore.config.track,
      backgroundMusicStore.config.muted,
      backgroundMusicStore.runtime.playback_state,
    ],
  )

  if (!roomEnabled && !showDeviceSetup) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="studio-grid-bg flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <DeviceSetupModal
        deviceStore={deviceStore}
        open={showDeviceSetup}
        onConfirm={handleDeviceConfirm}
      />

      <SceneDevicePickerModal
        open={showSceneDevicePicker}
        onConfirm={(selection) => void handleSceneDevicesConfirm(selection)}
        onCancel={() => setShowSceneDevicePicker(false)}
      />

      <AddSceneModal
        open={showAddSceneModal}
        onOpenChange={setShowAddSceneModal}
        onChooseCamera={handleChooseCameraScene}
        onChooseCountdown={handleChooseCountdownScene}
      />

      <CountdownConfigModal
        open={showCountdownModal}
        onOpenChange={setShowCountdownModal}
        cameraScenes={cameraScenes}
        onSave={(duration, targetId) => void handleCountdownSave(duration, targetId)}
        isSaving={sceneStore.isMutating}
      />

      <TopToolbar
        title={title}
        subtitle={subtitle}
        connectionState={connectionState}
        connectionError={error}
        isHost={context.isHost}
        recordingState={outputStore.recordingState}
        streamingState={outputStore.streamingState}
        onStartRecording={() => void handleStartRecording()}
        onStopRecording={() => void handleStopRecording()}
        onStartStream={(t, d) => void handleStartStream(t, d)}
        onStopStream={() => void handleStopStream()}
        onEndSession={context.isHost ? () => void handleEndSession() : undefined}
      />

      <div className="flex flex-1 overflow-hidden">
        <ScenesSidebar
          scenes={sceneStore.scenes}
          isHost={context.isHost}
          isLoading={sceneStore.isLoading}
          isMutating={sceneStore.isMutating}
          onAddScene={handleAddScene}
          onActivate={(id) => void handleActivateScene(id)}
          onRename={handleRenameScene}
          onDelete={(id) => void handleDeleteScene(id)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <PreviewCanvas
              layout={outputStore.layout}
              participants={previewParticipants}
              graphics={graphicsStore.graphics}
              countdownState={outputStore.countdownState}
              backgroundMusic={previewBackgroundMusic}
            />

            {context.isHost && (
              <div className="mt-4 w-full max-w-4xl">
                <LayoutPicker
                  layout={outputStore.layout}
                  onLayoutChange={(l) => void handleLayoutChange(l)}
                  disabled={backendSync.isSyncing}
                />
              </div>
            )}
          </div>

          <MediaBar
            micEnabled={micEnabled}
            webcamEnabled={webcamEnabled}
            onToggleMic={() => void toggleMic()}
            onToggleWebcam={() => void toggleWebcam()}
            onLeave={handleLeave}
            onDeviceSettings={() => setShowDeviceSetup(true)}
            leaveLabel={context.isHost ? 'Leave studio' : 'Leave'}
          />
        </main>

        <StudioSidebar
          layout={outputStore.layout}
          isHost={context.isHost}
          tileSources={tileOrder.tileSources}
          usingSceneOverride={tileOrder.usingSceneOverride}
          graphics={graphicsStore.graphics}
          backgroundMusicStore={backgroundMusicStore}
          inviteUrl={context.isHost ? context.inviteUrl : undefined}
          onGraphicUpdate={(layer, value) => void graphicsStore.updateLayer(layer, value)}
          onReorderSources={(from, to) => void tileOrder.reorderSources(from, to)}
          onResetTileOrder={() => void tileOrder.resetTileOrder()}
          onPin={tileOrder.togglePin}
          onHide={(sourceId) => void tileOrder.toggleHide(sourceId)}
          onMute={() => void toggleMic()}
          isSyncing={graphicsStore.isSyncing || tileOrder.isSyncing || backgroundMusicStore.isMutating}
        />
      </div>
    </div>
  )
}
