import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { TopToolbar } from '@/components/studio/toolbar/TopToolbar'
import { MediaBar } from '@/components/studio/toolbar/MediaBar'
import { PreviewCanvas } from '@/components/studio/preview/PreviewCanvas'
import { LayoutPicker } from '@/components/studio/layout/LayoutPicker'
import { StudioSidebar } from '@/components/studio/sidebar/StudioSidebar'
import { DeviceSetupModal } from '@/components/studio/device-setup/DeviceSetupModal'
import { useDeviceStore } from '@/hooks/useDeviceStore'
import { useRoom } from '@/hooks/useRoom'
import { useBackendSync } from '@/hooks/useBackendSync'
import { useOutputStore } from '@/hooks/useOutputStore'
import { useParticipantStore } from '@/hooks/useParticipantStore'
import { useGraphicsStore } from '@/hooks/useGraphicsStore'
import { clearStudioContext } from '@/lib/studioContext'
import { endSession } from '@/api/sessions'
import type { StudioSessionContext } from '@/types/session'
import type { LayoutType } from '@/types/session'

interface StudioLayoutProps {
  context: StudioSessionContext
  sessionId: string
}

export function StudioLayout({ context, sessionId }: StudioLayoutProps) {
  const navigate = useNavigate()
  const deviceStore = useDeviceStore()
  const [showDeviceSetup, setShowDeviceSetup] = useState(!deviceStore.isSetupComplete)
  const [roomEnabled, setRoomEnabled] = useState(false)

  const outputStore = useOutputStore({
    sessionId,
    isHost: context.isHost,
    initialLayout: context.layout,
  })
  const backendSync = useBackendSync(sessionId, context.isHost)
  const graphicsStore = useGraphicsStore(sessionId, context.isHost)

  const {
    connectionState,
    participants,
    error,
    micEnabled,
    webcamEnabled,
    toggleMic,
    toggleWebcam,
    publishProducers,
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

  const { studioParticipants, togglePin, toggleHide } = useParticipantStore(
    participants,
    hostPeerId,
    connectionState,
    context.roomId,
  )

  useEffect(() => {
    if (deviceStore.isSetupComplete && !showDeviceSetup) {
      void deviceStore.startPreview()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeviceConfirm = useCallback(async () => {
    setShowDeviceSetup(false)
    setRoomEnabled(true)
    deviceStore.stopPreview()
  }, [deviceStore])

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
      `${studioParticipants.length} participant${studioParticipants.length === 1 ? '' : 's'} · ${outputStore.layout}`,
    [studioParticipants.length, outputStore.layout],
  )

  const handleLayoutChange = useCallback(
    async (layout: LayoutType) => {
      outputStore.setLayout(layout)
      await backendSync.syncLayout(layout)
      toast.success(`Layout: ${layout}`)
    },
    [outputStore, backendSync],
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
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <PreviewCanvas
              layout={outputStore.layout}
              participants={studioParticipants}
              graphics={graphicsStore.graphics}
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
          participants={studioParticipants}
          graphics={graphicsStore.graphics}
          inviteUrl={context.isHost ? context.inviteUrl : undefined}
          onGraphicUpdate={(layer, value) => void graphicsStore.updateLayer(layer, value)}
          onPin={togglePin}
          onHide={toggleHide}
          onMute={() => void toggleMic()}
          isSyncing={graphicsStore.isSyncing}
        />
      </div>
    </div>
  )
}
