import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { MediaBar } from '@/components/studio/toolbar/MediaBar'
import { PreviewCanvas } from '@/components/studio/preview/PreviewCanvas'
import { LayoutPicker } from '@/components/studio/layout/LayoutPicker'
import { StudioSidebar } from '@/components/studio/sidebar/StudioSidebar'
import { ScenesSidebar } from '@/components/studio/scenes/ScenesSidebar'
import { StudioMobileNav } from '@/components/studio/layout/StudioMobileNav'
import { AddSceneModal } from '@/components/studio/scenes/AddSceneModal'
import { CountdownConfigModal } from '@/components/studio/scenes/CountdownConfigModal'
import { SceneDevicePickerModal } from '@/components/studio/scenes/SceneDevicePickerModal'
import { DeviceSetupModal } from '@/components/studio/device-setup/DeviceSetupModal'
import { YouTubeGoLiveErrorDialog } from '@/components/studio/YouTubeGoLiveErrorDialog'
import { useDeviceStore } from '@/hooks/useDeviceStore'
import { hasSceneDevices } from '@/lib/devices'
import { countdownSecondsRemaining } from '@/lib/countdown'
import { useRoom } from '@/hooks/useRoom'
import { useBackendSync } from '@/hooks/useBackendSync'
import { useOutputStore } from '@/hooks/useOutputStore'
import { useTileOrderStore } from '@/hooks/useTileOrderStore'
import { useSessionSourcesStore } from '@/hooks/useSessionSourcesStore'
import { useGraphicsStore } from '@/hooks/useGraphicsStore'
import { useBackgroundMusicStore } from '@/hooks/useBackgroundMusicStore'
import { useSceneStore } from '@/hooks/useSceneStore'
import { useIsDrawerMode } from '@/hooks/useBreakpoint'
import { useTenant } from '@/context/TenantProvider'
import { useStudioChat } from '@/hooks/useStudioChat'
import { useSocialChatOverlay } from '@/hooks/useSocialChatOverlay'
import { isStudioChatEnabled } from '@/lib/studioChatEnv'
import { useCmsEmbedBridge } from '@/context/CmsEmbedBridgeProvider'
import { useStudioHeaderControls } from '@/context/StudioHeaderControlsProvider'
import { hydrateCompositorFromPersistence } from '@/lib/hydrateFromPersistence'
import { restoreSessionSources } from '@/lib/restoreSessionSources'
import { applyActiveScenePreviewState } from '@/lib/applyActiveScenePreview'
import { isPersistenceEnabled } from '@/lib/tenantEnv'
import {
  ensureAllScenesLinked,
  getLocalTenantConfiguration,
  persistDestinationsFromStream,
  persistLayout,
  persistSceneLayout,
  persistGraphics,
  setPersistenceSessionId,
} from '@/lib/persistenceSync'
import {
  formatStreamDestinationSummary,
  getStreamableDestinations,
  hasTwitchStreamDestination,
  refreshFacebookStreamKeys,
  refreshTwitchStreamKeys,
  refreshYouTubeStreamKeys,
  registerTwitchChatForGoLive,
  toStreamDestinationInputs,
  willStreamToFacebook,
  willStreamToYouTube,
} from '@/lib/streamDestinations'
import { isEmbedErrorHandledByParent } from '@/lib/integration/cmsEmbedProtocol'
import {
  resolveYouTubeGoLiveErrorVariant,
  shouldShowYouTubeGoLiveDialog,
  type YouTubeGoLiveErrorVariant,
} from '@/lib/youtubeGoLiveErrors'
import { tileSourceToStudioParticipant } from '@/types/participants'
import { clearStudioContext } from '@/lib/studioContext'
import { endSession } from '@/api/sessions'
import type { StudioSessionContext } from '@/types/session'
import type { LayoutType } from '@/types/session'
import type { ChatGraphic } from '@/types/graphics'
import type { DeviceSelection } from '@/types/devices'

interface StudioLayoutProps {
  context: StudioSessionContext
  sessionId: string
}

export function StudioLayout({ context, sessionId }: StudioLayoutProps) {
  const navigate = useNavigate()
  const { configuration, refreshConfiguration, tenantId } = useTenant()
  const { isEmbedded, requestFacebookLiveRefresh, requestYouTubeLiveRefresh, registerTwitchChat, notifyStudioSession } =
    useCmsEmbedBridge()
  const { setControls } = useStudioHeaderControls()
  const deviceStore = useDeviceStore()
  const [showDeviceSetup, setShowDeviceSetup] = useState(!deviceStore.isSetupComplete)
  const [showSceneDevicePicker, setShowSceneDevicePicker] = useState(false)
  const [showAddSceneModal, setShowAddSceneModal] = useState(false)
  const [showCountdownModal, setShowCountdownModal] = useState(false)
  const [youtubeGoLiveErrorVariant, setYoutubeGoLiveErrorVariant] =
    useState<YouTubeGoLiveErrorVariant | null>(null)
  const [roomEnabled, setRoomEnabled] = useState(false)
  const [scenesDrawerOpen, setScenesDrawerOpen] = useState(false)
  const [controlsDrawerOpen, setControlsDrawerOpen] = useState(false)
  const isDrawerMode = useIsDrawerMode()

  const outputStore = useOutputStore({
    sessionId,
    isHost: context.isHost,
    initialLayout: context.layout,
  })
  const {
    recordingState,
    streamingState,
    setRecordingAction,
    setStreamingAction,
    refresh: refreshOutput,
  } = outputStore
  const backendSync = useBackendSync(sessionId, context.isHost)
  const {
    syncStartRecording,
    syncStopRecording,
    syncStartStreaming,
    syncStopStreaming,
  } = backendSync
  const savedDestinations = useMemo(
    () => configuration?.destinations ?? [],
    [configuration?.destinations],
  )
  const platformConnections = useMemo(
    () => configuration?.platform_connections ?? [],
    [configuration?.platform_connections],
  )
  const sceneStore = useSceneStore(sessionId, context.isHost, outputStore.setCountdownState)
  const graphicsStore = useGraphicsStore(sessionId, context.isHost, sceneStore.activeSceneId)
  const backgroundMusicStore = useBackgroundMusicStore({
    sessionId,
    isHost: context.isHost,
    activeSceneId: sceneStore.activeSceneId,
    scenes: sceneStore.scenes,
    onSceneUpdated: sceneStore.patchScene,
  })
  const prevCountdownActive = useRef(false)
  const hydrationStartedRef = useRef(false)

  useEffect(() => {
    setPersistenceSessionId(sessionId)
    return () => setPersistenceSessionId(null)
  }, [sessionId])

  useEffect(() => {
    if (!isEmbedded || !sessionId) return
    notifyStudioSession(sessionId)
  }, [isEmbedded, sessionId, notifyStudioSession])

  useEffect(() => {
    if (!context.isHost || hydrationStartedRef.current) return
    hydrationStartedRef.current = true

    void (async () => {
      try {
        await refreshConfiguration()
        const config = getLocalTenantConfiguration()
        if (!config) return

        await hydrateCompositorFromPersistence(sessionId, config)
        const scenes = await sceneStore.refresh()
        await ensureAllScenesLinked(sessionId, scenes)
        applyActiveScenePreviewState(scenes, {
          outputStore,
          graphicsStore,
          backgroundMusicStore,
          applyDevicePreferences: false,
        })
        await graphicsStore.refresh({ force: true })
      } catch (err) {
        console.warn('[persistence] studio hydration failed', err)
      }
    })()
  }, [
    context.isHost,
    sessionId,
    sceneStore,
    outputStore,
    graphicsStore,
    backgroundMusicStore,
    deviceStore,
    refreshConfiguration,
  ])

  const {
    connectionState,
    participants,
    error,
    micEnabled,
    webcamEnabled,
    isPublished,
    toggleMic,
    toggleWebcam,
    publishProducers,
    switchDevices,
    produceCameraSource,
    stopCameraSource,
    produceScreenShare,
    stopScreenShare,
    leave,
  } = useRoom({
    roomId: context.roomId,
    peerId: context.peerId,
    displayName: context.displayName,
    mediasoupWsUrl: context.mediasoupWsUrl,
    enabled: roomEnabled,
    autoPublish: false,
  })

  const publishedRef = useRef(false)

  const hostPeerId = useMemo(() => {
    if (context.isHost) return context.peerId
    const hostParticipant = participants.find(
      (p) => !p.isLocal && p.displayName.includes(context.hostDisplayName),
    )
    return hostParticipant?.peerId ?? participants.find((p) => !p.isLocal)?.peerId ?? context.peerId
  }, [context, participants])

  const studioChat = useStudioChat({
    sessionId,
    userId: context.peerId,
    displayName: context.displayName,
    role: context.isHost ? 'host' : 'participant',
    tenantId: tenantId ?? undefined,
    enabled: isStudioChatEnabled(),
    onError: (message) => toast.error(message),
  })

  const handleChatOverlayUpdated = useCallback(
    (chat: ChatGraphic) => {
      graphicsStore.patchGraphics({ chat })
    },
    [graphicsStore.patchGraphics],
  )

  const handleChatOverlayPersist = useCallback(
    (chat: ChatGraphic) => {
      void persistGraphics({ chat }, sessionId, sceneStore.activeSceneId)
    },
    [sceneStore.activeSceneId, sessionId],
  )

  const socialChatOverlay = useSocialChatOverlay({
    sessionId,
    isHost: context.isHost,
    comments: studioChat.socialComments,
    initialEnabled: Boolean(graphicsStore.graphics?.chat?.enabled),
    onChatUpdated: handleChatOverlayUpdated,
    onPersistChat: handleChatOverlayPersist,
  })

  const activeSceneSources = useMemo(
    () => sceneStore.scenes.find((scene) => scene.is_active)?.sources,
    [sceneStore.scenes],
  )

  const sessionSourcesStore = useSessionSourcesStore({
    sessionId,
    isHost: context.isHost,
    activeSceneId: sceneStore.activeSceneId,
    sceneSourcesConfig: activeSceneSources,
    onSceneSourcesUpdated: sceneStore.patchActiveSceneSourcesConfig,
  })

  const { sources, replaceSources, play } = sessionSourcesStore

  // Stabilize restore effect deps (store object identity changes each render).
  const replaceSourcesRef = useRef(replaceSources)
  replaceSourcesRef.current = replaceSources
  const playSourceRef = useRef(play)
  playSourceRef.current = play
  const sceneRefreshRef = useRef(sceneStore.refresh)
  sceneRefreshRef.current = sceneStore.refresh

  const sourcesRestoredRef = useRef(false)

  useEffect(() => {
    if (!context.isHost || !roomEnabled || connectionState !== 'connected' || !isPublished) {
      return
    }
    if (sourcesRestoredRef.current) return
    sourcesRestoredRef.current = true

    void (async () => {
      try {
        const result = await restoreSessionSources({
          sessionId,
          peerId: context.peerId,
          produceCameraSource,
          playSource: (sourceId) => playSourceRef.current(sourceId),
        })
        replaceSourcesRef.current(result.sources)
        await sceneRefreshRef.current()
        if (result.unavailableCameraLabels.length > 0) {
          toast.message(
            `Camera not available: ${result.unavailableCameraLabels.join(', ')}`,
          )
        }
      } catch (err) {
        sourcesRestoredRef.current = false
        console.warn('[sources] restore after hydrate failed', err)
      }
    })()
  }, [
    context.isHost,
    context.peerId,
    roomEnabled,
    connectionState,
    isPublished,
    sessionId,
    produceCameraSource,
  ])

  const tileOrder = useTileOrderStore({
    sessionId,
    isHost: context.isHost,
    hostPeerId,
    participants,
    connectionState,
    roomId: context.roomId,
    activeSceneId: sceneStore.activeSceneId,
    sceneSourcesConfig: activeSceneSources,
    sessionSources: sources,
    onSceneSourcesUpdated: sceneStore.patchActiveSceneSources,
  })

  const previewParticipants = useMemo(
    () => tileOrder.visibleTileSources.map(tileSourceToStudioParticipant),
    [tileOrder.visibleTileSources],
  )

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

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
      if (!hasSceneDevices(devices)) return
      const resolved = await switchDevices(devices)
      if (resolved) {
        deviceStore.setSelection(resolved)
      }
    },
    [deviceStore, switchDevices],
  )

  useEffect(() => {
    if (!roomEnabled || connectionState !== 'connected' || publishedRef.current) return
    publishedRef.current = true
    void (async () => {
      const resolved = await switchDevices(deviceStore.selection)
      if (resolved) {
        deviceStore.setSelection(resolved)
      }
      await publishProducers()
    })()
  }, [roomEnabled, connectionState, publishProducers, switchDevices, deviceStore])

  const handleLayoutChange = useCallback(
    async (layout: LayoutType) => {
      outputStore.setLayout(layout)
      await backendSync.syncLayout(layout)
      void persistLayout(layout)
      if (sceneStore.activeSceneId) {
        void persistSceneLayout(sessionId, sceneStore.activeSceneId, layout)
        const active = sceneStore.scenes.find((scene) => scene.scene_id === sceneStore.activeSceneId)
        if (active) {
          sceneStore.patchScene({ ...active, layout })
        }
      }
      toast.success(`Layout: ${layout}`)
    },
    [outputStore, backendSync, sceneStore, sessionId],
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
    setRecordingAction('starting')
    await syncStartRecording()
    setRecordingAction(null)
    await refreshOutput()
    toast.success('Recording started')
  }, [setRecordingAction, syncStartRecording, refreshOutput])

  const handleStopRecording = useCallback(async () => {
    setRecordingAction('stopping')
    await syncStopRecording()
    setRecordingAction(null)
    await refreshOutput()
    toast.success('Recording stopped')
  }, [setRecordingAction, syncStopRecording, refreshOutput])

  const handleStartStream = useCallback(
    async (type: 'RTMP' | 'HLS', destinations?: Parameters<typeof syncStartStreaming>[1]) => {
      setStreamingAction('starting')
      try {
        if (type === 'HLS') {
          const result = await syncStartStreaming('HLS')
          if (result) toast.success('HLS stream started')
          return
        }

        let resolvedDestinations = destinations

        if (tenantId && isPersistenceEnabled()) {
          const currentStreamable = getStreamableDestinations(
            savedDestinations,
            platformConnections,
          )
          const shouldRefreshFacebook =
            isEmbedded && willStreamToFacebook(currentStreamable, resolvedDestinations)
          const shouldRefreshYouTube =
            isEmbedded &&
            willStreamToYouTube(platformConnections, savedDestinations, resolvedDestinations)

          await refreshTwitchStreamKeys(tenantId, platformConnections)
          if (shouldRefreshFacebook) {
            try {
              await refreshFacebookStreamKeys(
                tenantId,
                platformConnections,
                requestFacebookLiveRefresh,
                sessionId,
              )
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : 'Failed to refresh Facebook stream key before going live',
              )
              return
            }
          }
          if (shouldRefreshYouTube) {
            try {
              await refreshYouTubeStreamKeys(
                tenantId,
                platformConnections,
                requestYouTubeLiveRefresh,
                sessionId,
              )
            } catch (err) {
              if (shouldShowYouTubeGoLiveDialog(isEmbedded)) {
                setYoutubeGoLiveErrorVariant(resolveYouTubeGoLiveErrorVariant(err))
                return
              }
              if (!isEmbedErrorHandledByParent(err)) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : 'Failed to refresh YouTube stream key before going live',
                )
              }
              return
            }
          }
          await refreshConfiguration()
          const freshConfig = getLocalTenantConfiguration()
          const freshStreamable = getStreamableDestinations(
            freshConfig?.destinations ?? [],
            freshConfig?.platform_connections ?? [],
          )

          if (resolvedDestinations?.length) {
            const selectedLabels = new Set(
              resolvedDestinations.map((item) => item.label?.trim() || 'Custom'),
            )
            const fromSaved = toStreamDestinationInputs(
              freshStreamable.filter((item) =>
                selectedLabels.has(item.label.trim() || item.platform || 'Custom'),
              ),
            )
            const manual = resolvedDestinations.filter(
              (item) =>
                item.url.trim() &&
                !freshStreamable.some(
                  (saved) =>
                    (saved.label.trim() || saved.platform || 'Custom') ===
                    (item.label?.trim() || 'Custom'),
                ),
            )
            resolvedDestinations = [...fromSaved, ...manual].filter((item) => item.url.trim())

            if (manual.length > 0) {
              void persistDestinationsFromStream(manual)
            }
          } else {
            resolvedDestinations = toStreamDestinationInputs(freshStreamable)
          }
        }

        if (!resolvedDestinations?.length) {
          toast.error('No connected destinations available. Connect a destination first.')
          return
        }

        const result = await syncStartStreaming('RTMP', resolvedDestinations, {
          tenantId: tenantId ?? undefined,
          twitchChatEnabled: hasTwitchStreamDestination(resolvedDestinations),
        })
        if (result) {
          if (isEmbedded && tenantId && isPersistenceEnabled()) {
            try {
              const freshConfig = getLocalTenantConfiguration()
              await registerTwitchChatForGoLive(
                tenantId,
                freshConfig?.platform_connections ?? platformConnections,
                freshConfig?.destinations ?? savedDestinations,
                registerTwitchChat,
                sessionId,
                resolvedDestinations,
              )
            } catch (err) {
              console.warn('[StudioLayout] Twitch chat registration failed:', err)
            }
          }
          toast.success(`Live on ${formatStreamDestinationSummary(resolvedDestinations)}`)
        }
      } finally {
        setStreamingAction(null)
        await refreshOutput()
      }
    },
    [
      setStreamingAction,
      syncStartStreaming,
      refreshOutput,
      tenantId,
      sessionId,
      platformConnections,
      refreshConfiguration,
      savedDestinations,
      isEmbedded,
      requestFacebookLiveRefresh,
      requestYouTubeLiveRefresh,
      registerTwitchChat,
    ],
  )

  const handleStopStream = useCallback(async () => {
    setStreamingAction('stopping')
    await syncStopStreaming()
    setStreamingAction(null)
    await refreshOutput()
    toast.success('Stream stopped')
  }, [setStreamingAction, syncStopStreaming, refreshOutput])

  const handleEndSession = useCallback(async () => {
    await endSession(sessionId)
    leave()
    clearStudioContext()
    navigate('/')
  }, [sessionId, leave, navigate])

  const showHeaderControls = roomEnabled && deviceStore.isSetupComplete
  const showOutputControls = context.isHost && showHeaderControls

  useEffect(() => {
    if (!showHeaderControls) {
      setControls(null)
      return
    }

    setControls({
      connectionState,
      connectionError: error,
      output: showOutputControls
        ? {
            recordingState,
            streamingState,
            savedDestinations,
            platformConnections,
            onStartRecording: () => void handleStartRecording(),
            onStopRecording: () => void handleStopRecording(),
            onStartStream: (type, destinations) => void handleStartStream(type, destinations),
            onStopStream: () => void handleStopStream(),
          }
        : undefined,
      onEndSession: showOutputControls ? () => void handleEndSession() : undefined,
    })

    return () => setControls(null)
  }, [
    showHeaderControls,
    showOutputControls,
    setControls,
    connectionState,
    error,
    recordingState,
    streamingState,
    savedDestinations,
    platformConnections,
    handleStartRecording,
    handleStopRecording,
    handleStartStream,
    handleStopStream,
    handleEndSession,
  ])

  const handleLeave = useCallback(() => {
    leave()
    clearStudioContext()
    navigate(context.isHost ? '/' : '/')
  }, [leave, navigate, context.isHost])

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
    <div className="studio-grid-bg flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
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

      <YouTubeGoLiveErrorDialog
        open={youtubeGoLiveErrorVariant !== null}
        onOpenChange={(open) => {
          if (!open) setYoutubeGoLiveErrorVariant(null)
        }}
        variant={youtubeGoLiveErrorVariant ?? 'live_not_enabled'}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <ScenesSidebar
          scenes={sceneStore.scenes}
          isHost={context.isHost}
          isLoading={sceneStore.isLoading}
          isMutating={sceneStore.isMutating}
          onAddScene={handleAddScene}
          onActivate={(id) => void handleActivateScene(id)}
          onRename={handleRenameScene}
          onDelete={(id) => void handleDeleteScene(id)}
          drawerOpen={scenesDrawerOpen}
          onDrawerOpenChange={setScenesDrawerOpen}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="studio-panel-scroll flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
            <PreviewCanvas
              layout={outputStore.layout}
              participants={previewParticipants}
              graphics={graphicsStore.graphics}
              countdownState={outputStore.countdownState}
              backgroundMusic={previewBackgroundMusic}
            />

            {context.isHost && (
              <div className="mt-2 flex w-full max-w-4xl justify-center sm:mt-3">
                <LayoutPicker
                  layout={outputStore.layout}
                  onLayoutChange={(l) => void handleLayoutChange(l)}
                  disabled={backendSync.isSyncing}
                />
              </div>
            )}

            <MediaBar
              micEnabled={micEnabled}
              webcamEnabled={webcamEnabled}
              onToggleMic={() => void toggleMic()}
              onToggleWebcam={() => void toggleWebcam()}
              onLeave={handleLeave}
              onDeviceSettings={() => setShowDeviceSetup(true)}
              leaveLabel={context.isHost ? 'Leave studio' : 'Leave'}
              className="mt-2 sm:mt-3"
            />
          </div>

          {isDrawerMode && (
            <StudioMobileNav
              scenesOpen={scenesDrawerOpen}
              controlsOpen={controlsDrawerOpen}
              onScenesOpen={() => {
                setControlsDrawerOpen(false)
                setScenesDrawerOpen(true)
              }}
              onControlsOpen={() => {
                setScenesDrawerOpen(false)
                setControlsDrawerOpen(true)
              }}
            />
          )}
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
          onGraphicUpdateLayers={(partial) => void graphicsStore.updateLayers(partial)}
          onReorderSources={(from, to) => void tileOrder.reorderSources(from, to)}
          onResetTileOrder={() => void tileOrder.resetTileOrder()}
          onPin={tileOrder.togglePin}
          onHide={(sourceId) => void tileOrder.toggleHide(sourceId)}
          onMute={() => void toggleMic()}
          isSyncing={
            graphicsStore.isSyncing ||
            tileOrder.isSyncing ||
            backgroundMusicStore.isMutating ||
            sessionSourcesStore.isMutating
          }
          drawerOpen={controlsDrawerOpen}
          onDrawerOpenChange={setControlsDrawerOpen}
          sessionId={sessionId}
          activeSceneId={sceneStore.activeSceneId}
          sourcesStore={sessionSourcesStore}
          produceCameraSource={produceCameraSource}
          stopCameraSource={stopCameraSource}
          produceScreenShare={produceScreenShare}
          stopScreenShare={stopScreenShare}
          currentUserId={context.peerId}
          hostPeerId={hostPeerId}
          participants={participants}
          chat={studioChat}
          socialChatOverlay={context.isHost ? socialChatOverlay : undefined}
        />
      </div>
    </div>
  )
}
