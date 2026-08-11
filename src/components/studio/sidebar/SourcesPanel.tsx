import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  Monitor,
  Radio,
  Image as ImageIcon,
  Music,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { listCmsVideos, type CmsVideo } from '@/api/cmsVideos'
import { ApiError } from '@/api/client'
import { SceneItemsList } from '@/components/studio/sidebar/SceneItemsList'
import { Button } from '@/components/ui/button'
import { enumerateMediaDevices } from '@/lib/devices'
import { mediaErrorMessage } from '@/lib/openMediaStream'
import { normalizeDeviceLabel } from '@/lib/resolveDevice'
import { matchesHostWebcamDevice, sourceIdentityKey } from '@/lib/sourceCatalog'
import { cn } from '@/lib/utils'
import type { SessionSourcesStore } from '@/hooks/useSessionSourcesStore'
import type { CameraSourceSettings, PreRecordedSourceSettings, SourceType } from '@/types/sources'

type CategoryId = SourceType

interface CategoryCard {
  id: CategoryId
  label: string
  icon: typeof Camera
  enabled: boolean
}

const CATEGORIES: CategoryCard[] = [
  { id: 'camera', label: 'Camera', icon: Camera, enabled: true },
  { id: 'screen', label: 'Screen Share', icon: Monitor, enabled: true },
  { id: 'prerecorded', label: 'Pre-recorded', icon: Film, enabled: true },
  { id: 'rtmp', label: 'RTMP', icon: Radio, enabled: false },
  { id: 'image', label: 'Image', icon: ImageIcon, enabled: false },
  { id: 'audio', label: 'Audio', icon: Music, enabled: false },
  { id: 'pdf', label: 'PDF', icon: FileText, enabled: false },
]

interface VideoDeviceOption {
  deviceId: string
  label: string
}

interface SourcesPanelProps {
  isHost: boolean
  sessionId?: string
  activeSceneId: string | null
  sourcesStore: SessionSourcesStore
  peerId?: string
  hostWebcamDeviceId?: string | null
  hostWebcamLabel?: string | null
  produceCameraSource?: (sourceId: string, deviceId: string) => Promise<{ producerId: string }>
  stopCameraSource?: (sourceId: string) => Promise<void>
  produceScreenShare?: (sourceId: string) => Promise<{ producerId: string }>
  stopScreenShare?: (sourceId: string) => Promise<void>
}

function resolveMediaUrl(video: CmsVideo): string {
  return (video.source_file || video.output_file || '').trim()
}

export function SourcesPanel({
  isHost,
  activeSceneId,
  sourcesStore,
  peerId,
  hostWebcamDeviceId,
  hostWebcamLabel,
  produceCameraSource,
  produceScreenShare,
}: SourcesPanelProps) {
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [devices, setDevices] = useState<VideoDeviceOption[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [videos, setVideos] = useState<CmsVideo[]>([])
  const [videosPage, setVideosPage] = useState(1)
  const [videosCount, setVideosCount] = useState(0)
  const [videosLoading, setVideosLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const pageSize = 12
  const totalPages = Math.max(1, Math.ceil(videosCount / pageSize))

  const attachedCameraKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const item of sourcesStore.sceneItems) {
      const source = sourcesStore.sourceById.get(item.sourceId)
      if (source?.type !== 'camera') continue
      keys.add(sourceIdentityKey('camera', source.settings))
      const settings = source.settings as CameraSourceSettings
      if (settings?.deviceId) keys.add(`camera:id:${settings.deviceId}`)
    }
    return keys
  }, [sourcesStore.sceneItems, sourcesStore.sourceById])

  const attachedCmsVideoUuids = useMemo(() => {
    const ids = new Set<string>()
    for (const item of sourcesStore.sceneItems) {
      const source = sourcesStore.sourceById.get(item.sourceId)
      if (source?.type !== 'prerecorded') continue
      const settings = source.settings as PreRecordedSourceSettings
      if (settings?.cmsVideoUuid) ids.add(settings.cmsVideoUuid)
    }
    return ids
  }, [sourcesStore.sceneItems, sourcesStore.sourceById])

  const isCameraAttached = useCallback(
    (device: VideoDeviceOption) => {
      const byLabel = sourceIdentityKey('camera', {
        deviceId: device.deviceId,
        deviceLabel: device.label,
      })
      return (
        attachedCameraKeys.has(byLabel) ||
        attachedCameraKeys.has(`camera:id:${device.deviceId}`) ||
        attachedCameraKeys.has(
          `camera:label:${normalizeDeviceLabel(device.label)}`,
        )
      )
    },
    [attachedCameraKeys],
  )

  const isHostWebcamDevice = useCallback(
    (device: VideoDeviceOption) =>
      matchesHostWebcamDevice(
        { deviceId: device.deviceId, deviceLabel: device.label },
        { deviceId: hostWebcamDeviceId, label: hostWebcamLabel },
      ),
    [hostWebcamDeviceId, hostWebcamLabel],
  )

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true)
    try {
      const all = await enumerateMediaDevices()
      setDevices(
        all
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera (${device.deviceId.slice(0, 8)})`,
          })),
      )
    } catch {
      toast.error('Could not list cameras')
      setDevices([])
    } finally {
      setDevicesLoading(false)
    }
  }, [])

  const loadVideos = useCallback(async (page: number) => {
    setVideosLoading(true)
    try {
      const result = await listCmsVideos({ page, pageSize })
      setVideos(result.results ?? [])
      setVideosCount(result.count ?? 0)
      setVideosPage(page)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not load CMS videos')
      setVideos([])
      setVideosCount(0)
    } finally {
      setVideosLoading(false)
    }
  }, [])

  useEffect(() => {
    if (category === 'camera') void loadDevices()
    if (category === 'prerecorded') void loadVideos(1)
  }, [category, loadDevices, loadVideos])

  const handleAddCamera = async (device: VideoDeviceOption) => {
    if (!activeSceneId) {
      toast.warning('Activate a scene before adding sources')
      return
    }
    if (isHostWebcamDevice(device)) {
      toast.message('That device is already the main scene camera')
      return
    }
    if (isCameraAttached(device)) {
      toast.message(`${device.label} is already on this scene`)
      return
    }
    setBusyKey(`camera:${device.deviceId}`)
    try {
      const result = await sourcesStore.createOrAttach({
        type: 'camera',
        name: device.label,
        settings: {
          deviceId: device.deviceId,
          deviceLabel: device.label,
          peerId,
          deviceAvailable: true,
        } satisfies CameraSourceSettings,
      })
      if (!result?.source) return
      if (result.alreadyAttached) {
        toast.message(`${device.label} is already on this scene`)
        return
      }

      // RoomClient is idempotent — skips a second getUserMedia if this sourceId is live.
      if (produceCameraSource) {
        try {
          const { producerId } = await produceCameraSource(result.source.id, device.deviceId)
          const existingSettings = result.source.settings as CameraSourceSettings
          if (existingSettings.producerId !== producerId || !result.reused) {
            await sourcesStore.update(result.source.id, {
              settings: {
                deviceId: device.deviceId,
                deviceLabel: device.label,
                peerId,
                producerId,
                deviceAvailable: true,
              } satisfies CameraSourceSettings,
            })
          }
        } catch (err) {
          toast.error(mediaErrorMessage(err, 'Could not publish camera'))
        }
      }
      toast.success(
        result.reused ? `Attached ${device.label} to this scene` : `Added ${device.label}`,
      )
    } finally {
      setBusyKey(null)
    }
  }

  const handleShareScreen = async () => {
    if (!activeSceneId) {
      toast.warning('Activate a scene before adding sources')
      return
    }
    setBusyKey('screen')
    try {
      const result = await sourcesStore.createOrAttach({
        type: 'screen',
        name: 'Screen Share',
        settings: { peerId },
      })
      if (!result?.source) return
      if (result.alreadyAttached) {
        toast.message('Screen share is already on this scene')
        return
      }

      if (produceScreenShare) {
        try {
          const { producerId } = await produceScreenShare(result.source.id)
          const existingSettings = result.source.settings as { producerId?: string }
          if (existingSettings.producerId !== producerId || !result.reused) {
            await sourcesStore.update(result.source.id, {
              settings: { peerId, producerId },
            })
          }
        } catch (err) {
          toast.error(mediaErrorMessage(err, 'Could not share screen'))
          if (!result.reused) {
            await sourcesStore.detach(result.source.id)
            await sourcesStore.remove(result.source.id)
          }
          return
        }
      }
      toast.success(
        result.reused ? 'Attached screen share to this scene' : 'Screen share added',
      )
    } finally {
      setBusyKey(null)
    }
  }

  const handleAddPrerecorded = async (video: CmsVideo) => {
    if (!activeSceneId) {
      toast.warning('Activate a scene before adding sources')
      return
    }
    if (attachedCmsVideoUuids.has(video.uuid)) {
      toast.message(`${video.title || 'Video'} is already on this scene`)
      return
    }
    const mediaUrl = resolveMediaUrl(video)
    if (!mediaUrl) {
      toast.error('This video has no playable media URL')
      return
    }
    setBusyKey(`video:${video.uuid}`)
    try {
      const result = await sourcesStore.createOrAttach({
        type: 'prerecorded',
        name: video.title || 'Pre-recorded Video',
        settings: {
          cmsVideoUuid: video.uuid,
          title: video.title || 'Pre-recorded Video',
          thumbnailUrl: video.thumbnail ?? undefined,
          duration: video.duration ?? undefined,
          mediaUrl,
          loop: true,
        } satisfies PreRecordedSourceSettings,
      })
      if (!result?.source) return
      if (result.alreadyAttached) {
        toast.message(`${video.title || 'Video'} is already on this scene`)
        return
      }
      // Keep playback running when reusing; play() is safe if already active.
      void sourcesStore.play(result.source.id)
      toast.success(
        result.reused
          ? `Attached ${video.title || 'video'} to this scene`
          : `Added ${video.title || 'video'}`,
      )
    } finally {
      setBusyKey(null)
    }
  }

  const handleDetach = async (sourceId: string) => {
    // Detach from this scene only — do not stop produce. The same Source may
    // still be attached (and visible) on another scene.
    await sourcesStore.detach(sourceId)
  }

  if (!isHost) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Only the host can manage studio sources
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {!category ? (
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                disabled={!card.enabled}
                onClick={() => setCategory(card.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
                  card.enabled
                    ? 'border-border/60 hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
                    : 'border-border/30 opacity-40 cursor-not-allowed',
                )}
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-[11px] font-medium leading-tight">{card.label}</span>
                {!card.enabled && (
                  <span className="text-[9px] text-muted-foreground">Coming soon</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setCategory(null)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <span className="text-xs font-medium text-muted-foreground">
              {CATEGORIES.find((c) => c.id === category)?.label}
            </span>
          </div>

          {category === 'camera' && (
            <div className="space-y-1.5">
              {devicesLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Listing cameras…
                </div>
              ) : devices.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No cameras found</p>
              ) : (
                devices.map((device) => {
                  const attached = isCameraAttached(device)
                  const isMainCam = isHostWebcamDevice(device)
                  const blocked = attached || isMainCam
                  const busy = busyKey === `camera:${device.deviceId}`
                  return (
                    <button
                      key={device.deviceId}
                      type="button"
                      disabled={blocked || busy || sourcesStore.isMutating || !activeSceneId}
                      onClick={() => void handleAddCamera(device)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-left text-sm transition-colors',
                        blocked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:border-primary/40 hover:bg-muted/40',
                      )}
                    >
                      <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{device.label}</span>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {isMainCam && (
                        <span className="text-[10px] text-muted-foreground">Main cam</span>
                      )}
                      {attached && !isMainCam && (
                        <span className="text-[10px] text-muted-foreground">On scene</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}

          {category === 'screen' && (
            <Button
              type="button"
              className="w-full"
              disabled={busyKey === 'screen' || sourcesStore.isMutating || !activeSceneId}
              onClick={() => void handleShareScreen()}
            >
              {busyKey === 'screen' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Share screen
            </Button>
          )}

          {category === 'prerecorded' && (
            <div className="space-y-2">
              {videosLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading videos…
                </div>
              ) : videos.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No CMS videos found</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {videos.map((video) => {
                    const attached = attachedCmsVideoUuids.has(video.uuid)
                    const busy = busyKey === `video:${video.uuid}`
                    const disabled =
                      attached || busy || sourcesStore.isMutating || !activeSceneId || !resolveMediaUrl(video)
                    return (
                      <button
                        key={video.uuid}
                        type="button"
                        disabled={disabled}
                        onClick={() => void handleAddPrerecorded(video)}
                        className={cn(
                          'flex flex-col overflow-hidden rounded-lg border border-border/50 text-left transition-colors',
                          disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:border-primary/40 hover:bg-muted/30',
                        )}
                      >
                        <div className="relative aspect-video bg-muted">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Film className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {busy && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5 p-2">
                          <p className="truncate text-[11px] font-medium leading-tight">
                            {video.title || 'Untitled'}
                          </p>
                          {attached && (
                            <p className="text-[9px] text-muted-foreground">On scene</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {videosCount > pageSize && (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={videosPage <= 1 || videosLoading}
                    onClick={() => void loadVideos(videosPage - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground">
                    Page {videosPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={videosPage >= totalPages || videosLoading}
                    onClick={() => void loadVideos(videosPage + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 border-t border-border/40 pt-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Scene items
        </p>
        {!activeSceneId ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No active scene</p>
        ) : (
          <SceneItemsList
            items={sourcesStore.sceneItems}
            sources={sourcesStore.sources}
            isHost={isHost}
            isSyncing={sourcesStore.isMutating}
            onReorder={(from, to) => void sourcesStore.reorder(from, to)}
            onToggleVisibility={(sourceId, visible) =>
              void sourcesStore.setVisibility(sourceId, visible)
            }
            onDetach={(sourceId) => void handleDetach(sourceId)}
            onPlay={(sourceId) => sourcesStore.play(sourceId)}
            onPause={(sourceId) => sourcesStore.pause(sourceId)}
            onSeek={(sourceId, positionMs) => sourcesStore.seek(sourceId, positionMs)}
            onVolumeChange={(sourceId, volume) => sourcesStore.setVolume(sourceId, volume)}
            onMutedChange={(sourceId, muted) => sourcesStore.setMuted(sourceId, muted)}
          />
        )}
      </div>
    </div>
  )
}
