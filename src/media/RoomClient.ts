import { AwaitQueue } from 'awaitqueue'
import * as mediasoupClient from 'mediasoup-client'
import type { types as MediasoupTypes } from 'mediasoup-client'
import protooClient from 'protoo-client'
import { enumerateMediaDevices } from '@/lib/devices'
import {
  deviceUnavailableMessage,
  resolveMediaDevice,
  resolveSelectionDevices,
} from '@/lib/resolveDevice'
import {
  mediaErrorMessage,
  openAudioStream,
  openDisplayMediaStream,
  openVideoStream,
  stopMediaStream,
} from '@/lib/openMediaStream'
import { getDeviceInfo } from '@/media/deviceInfo'
import { isCompositorPeer } from '@/lib/participants'
import type { DeviceSelection } from '@/types/devices'
import type { ConnectionState, ParticipantMedia } from '@/types/session'

const OPUS_CODEC_OPTIONS = {
  opusDtx: false,
  opusFec: true,
  opusNack: true,
  opusMaxAverageBitrate: 64000,
}

const WEBCAM_CODEC_OPTIONS = {
  videoGoogleStartBitrate: 2500,
}

const WEBCAM_ENCODINGS: RTCRtpEncodingParameters[] = [{ maxBitrate: 2_500_000 }]

export interface RoomClientOptions {
  roomId: string
  peerId: string
  displayName: string
  mediasoupWsUrl: string
  autoPublish?: boolean
  devicePreferences?: DeviceSelection | null
  onStateChange?: (state: ConnectionState) => void
  onParticipantsChange?: (participants: ParticipantMedia[]) => void
  onError?: (error: Error) => void
}

interface RemoteParticipant {
  peerId: string
  displayName: string
  consumers: Map<string, MediasoupTypes.Consumer>
}

export class RoomClient {
  private readonly options: RoomClientOptions
  private closed = false
  private protoo: InstanceType<typeof protooClient.Peer> | null = null
  private device: MediasoupTypes.Device | null = null
  private sendTransport: MediasoupTypes.Transport | null = null
  private recvTransport: MediasoupTypes.Transport | null = null
  private micProducer: MediasoupTypes.Producer | null = null
  private micStream: MediaStream | null = null
  private webcamProducer: MediasoupTypes.Producer | null = null
  private webcamStream: MediaStream | null = null
  /** Studio Sources producers keyed by sourceId (camera / screen). Separate from webcam. */
  private readonly sourceProducers = new Map<string, MediasoupTypes.Producer>()
  private readonly sourceStreams = new Map<string, MediaStream>()
  private readonly remoteParticipants = new Map<string, RemoteParticipant>()
  private readonly consumingQueue = new AwaitQueue()
  private micEnabled = false
  private webcamEnabled = false
  private devicePreferences: DeviceSelection | null = null

  constructor(options: RoomClientOptions) {
    this.options = options
    this.devicePreferences = options.devicePreferences ?? null
  }

  setDevicePreferences(preferences: DeviceSelection | null): void {
    this.devicePreferences = preferences
  }

  async publishProducers(options?: { mic?: boolean; webcam?: boolean }): Promise<void> {
    if (options?.mic !== false) {
      try {
        await this.enableMic()
      } catch (err) {
        this.reportError(err, 'Could not enable microphone.')
      }
    }
    if (options?.webcam !== false) {
      try {
        await this.enableWebcam()
      } catch (err) {
        this.reportError(err, 'Could not enable camera.')
      }
    }
  }

  get peerId() {
    return this.options.peerId
  }

  get displayName() {
    return this.options.displayName
  }

  async join(): Promise<void> {
    this.setState('connecting')

    const url = `${this.options.mediasoupWsUrl}/?roomId=${encodeURIComponent(this.options.roomId)}&peerId=${encodeURIComponent(this.options.peerId)}`
    const transport = new protooClient.WebSocketTransport(url)
    this.protoo = new protooClient.Peer(transport)

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('WebSocket connection timeout')), 15000)

      this.protoo!.on('open', () => {
        window.clearTimeout(timeout)
        resolve()
      })

      this.protoo!.on('failed', () => {
        window.clearTimeout(timeout)
        reject(new Error('WebSocket connection failed'))
      })
    })

    this.protoo.on('close', () => {
      if (!this.closed) {
        this.setState('disconnected')
      }
    })

    this.protoo.on('request', (...args: unknown[]) => {
      const [request, accept, reject] = args as [
        { method: string; data: Record<string, unknown> },
        () => void,
        (code: number, reason: string) => void,
      ]
      void this.handleProtooRequest(request, accept, reject)
    })

    this.protoo.on('notification', (...args: unknown[]) => {
      const [notification] = args as [{ method: string; data: Record<string, unknown> }]
      void this.handleProtooNotification(notification)
    })

    await this.joinRoom()
    this.setState('connected')
    this.emitParticipants()
  }

  async enableMic(): Promise<void> {
    if (!this.sendTransport || !this.device?.canProduce('audio') || this.micProducer) {
      return
    }

    const resolved = await this.resolvePreferences()
    const microphone = resolveMediaDevice(
      resolved.devices,
      {
        deviceId: resolved.selection.microphoneId,
        label: resolved.selection.microphoneLabel,
      },
      'audioinput',
    )
    if (!microphone) {
      throw new Error(deviceUnavailableMessage(resolved.selection, 'microphone'))
    }

    const stream = await openAudioStream(microphone.deviceId, 'producer', {
      label: microphone.label,
    })
    this.micStream = stream
    const track = stream.getAudioTracks()[0]

    this.micProducer = await this.sendTransport.produce({
      track,
      appData: { source: 'audio' },
      codecOptions: OPUS_CODEC_OPTIONS,
    })

    this.micEnabled = true
    this.micProducer.on('transportclose', () => {
      this.micProducer = null
      this.micEnabled = false
      this.emitParticipants()
    })

    this.emitParticipants()
  }

  async disableMic(): Promise<void> {
    if (!this.micProducer) return
    this.closeAndNotifyProducer(this.micProducer)
    this.micProducer = null
    this.stopMicStream()
    this.micEnabled = false
    this.emitParticipants()
  }

  async enableWebcam(): Promise<void> {
    if (!this.sendTransport || !this.device?.canProduce('video') || this.webcamProducer) {
      return
    }

    const resolved = await this.resolvePreferences()
    const camera = resolveMediaDevice(
      resolved.devices,
      {
        deviceId: resolved.selection.cameraId,
        label: resolved.selection.cameraLabel,
      },
      'videoinput',
    )
    if (!camera) {
      throw new Error(deviceUnavailableMessage(resolved.selection, 'camera'))
    }

    const stream = await openVideoStream(camera.deviceId, 'producer', {
      label: camera.label,
    })
    this.webcamStream = stream
    const track = stream.getVideoTracks()[0]

    this.webcamProducer = await this.sendTransport.produce({
      track,
      appData: { source: 'video' },
      codecOptions: WEBCAM_CODEC_OPTIONS,
      encodings: WEBCAM_ENCODINGS,
    })

    this.webcamEnabled = true
    this.webcamProducer.on('transportclose', () => {
      this.webcamProducer = null
      this.webcamEnabled = false
      this.emitParticipants()
    })

    this.emitParticipants()
  }

  async disableWebcam(): Promise<void> {
    if (!this.webcamProducer) return
    this.closeAndNotifyProducer(this.webcamProducer)
    this.webcamProducer = null
    this.stopWebcamStream()
    this.webcamEnabled = false
    this.emitParticipants()
  }

  async toggleMic(): Promise<void> {
    try {
      if (this.micEnabled) {
        await this.disableMic()
      } else {
        await this.enableMic()
      }
    } catch (err) {
      this.reportError(err, 'Could not toggle microphone.')
      throw err
    }
  }

  async toggleWebcam(): Promise<void> {
    try {
      if (this.webcamEnabled) {
        await this.disableWebcam()
      } else {
        await this.enableWebcam()
      }
    } catch (err) {
      this.reportError(err, 'Could not toggle camera.')
      throw err
    }
  }

  /**
   * Produce a Studio Sources camera feed as a separate producer (does not replace webcam).
   * appData: `{ source: 'video', sourceId }`.
   */
  async produceCameraSource(
    sourceId: string,
    deviceId: string,
  ): Promise<{ producerId: string }> {
    if (!this.sendTransport || !this.device?.canProduce('video')) {
      throw new Error('Cannot produce video — transport not ready.')
    }
    if (this.sourceProducers.has(sourceId)) {
      const existing = this.sourceProducers.get(sourceId)!
      return { producerId: existing.id }
    }

    const stream = await openVideoStream(deviceId, 'producer')
    const track = stream.getVideoTracks()[0]
    if (!track) {
      stopMediaStream(stream)
      throw new Error('No video track was returned.')
    }

    try {
      const producer = await this.sendTransport.produce({
        track,
        appData: { source: 'video', sourceId },
        codecOptions: WEBCAM_CODEC_OPTIONS,
        encodings: WEBCAM_ENCODINGS,
      })
      this.sourceStreams.set(sourceId, stream)
      this.sourceProducers.set(sourceId, producer)
      producer.on('transportclose', () => {
        this.sourceProducers.delete(sourceId)
        this.stopSourceStream(sourceId)
        this.emitParticipants()
      })
      this.emitParticipants()
      return { producerId: producer.id }
    } catch (err) {
      stopMediaStream(stream)
      throw err
    }
  }

  async stopCameraSource(sourceId: string): Promise<void> {
    await this.stopSourceProducer(sourceId)
  }

  /**
   * Produce screen share as a SEPARATE producer (does not replace webcam).
   * appData: `{ source: 'screensharing', sourceId }`.
   */
  async produceScreenShare(sourceId: string): Promise<{ producerId: string }> {
    if (!this.sendTransport || !this.device?.canProduce('video')) {
      throw new Error('Cannot produce video — transport not ready.')
    }
    if (this.sourceProducers.has(sourceId)) {
      const existing = this.sourceProducers.get(sourceId)!
      return { producerId: existing.id }
    }

    const stream = await openDisplayMediaStream({ audio: false })
    const track = stream.getVideoTracks()[0]
    if (!track) {
      stopMediaStream(stream)
      throw new Error('No screen video track was returned.')
    }

    track.addEventListener('ended', () => {
      void this.stopScreenShare(sourceId)
    })

    try {
      const producer = await this.sendTransport.produce({
        track,
        appData: { source: 'screensharing', sourceId },
        codecOptions: WEBCAM_CODEC_OPTIONS,
        encodings: WEBCAM_ENCODINGS,
      })
      this.sourceStreams.set(sourceId, stream)
      this.sourceProducers.set(sourceId, producer)
      producer.on('transportclose', () => {
        this.sourceProducers.delete(sourceId)
        this.stopSourceStream(sourceId)
        this.emitParticipants()
      })
      this.emitParticipants()
      return { producerId: producer.id }
    } catch (err) {
      stopMediaStream(stream)
      throw err
    }
  }

  async stopScreenShare(sourceId: string): Promise<void> {
    await this.stopSourceProducer(sourceId)
  }

  /**
   * Apply scene/settings device prefs.
   *
   * Hybrid:
   * - Media currently on → replaceTrack (same producer id; no compositor soft-disable)
   * - Media currently off → prefs only (next enableMic/enableWebcam uses new device)
   * Toolbar cam/mic off still uses hard-close → compositor placeholder path.
   */
  async replaceDevices(selection: DeviceSelection): Promise<DeviceSelection> {
    const devices = await enumerateMediaDevices()
    const resolved = resolveSelectionDevices(devices, selection)
    this.setDevicePreferences(resolved)

    if (this.micProducer && this.micEnabled) {
      try {
        await this.replaceMicTrack(devices, resolved)
      } catch (err) {
        this.reportError(err, 'Could not switch microphone.')
      }
    }

    if (this.webcamProducer && this.webcamEnabled) {
      try {
        await this.replaceWebcamTrack(devices, resolved)
      } catch (err) {
        this.reportError(err, 'Could not switch camera.')
      }
    }

    return resolved
  }

  close(): void {
    if (this.closed) return
    this.closed = true

    if (this.micProducer) {
      this.closeAndNotifyProducer(this.micProducer)
      this.micProducer = null
    }
    this.stopMicStream()
    if (this.webcamProducer) {
      this.closeAndNotifyProducer(this.webcamProducer)
      this.webcamProducer = null
    }
    this.stopWebcamStream()
    for (const sourceId of [...this.sourceProducers.keys()]) {
      void this.stopSourceProducer(sourceId)
    }
    this.sendTransport?.close()
    this.recvTransport?.close()
    this.protoo?.close()

    this.sendTransport = null
    this.recvTransport = null
    this.protoo = null
    this.remoteParticipants.clear()
    this.setState('disconnected')
  }

  /**
   * Close a local mediasoup producer and notify the SFU so remotes get
   * consumerClosed and the compositor poll drops the producer.
   */
  private closeAndNotifyProducer(producer: MediasoupTypes.Producer): void {
    const producerId = producer.id
    producer.close()
    try {
      this.protoo?.notify('closeProducer', { producerId })
    } catch {
      // Protoo may already be closing (e.g. room leave); peer teardown covers the rest.
    }
  }

  private async resolvePreferences(): Promise<{
    devices: Awaited<ReturnType<typeof enumerateMediaDevices>>
    selection: DeviceSelection
  }> {
    const devices = await enumerateMediaDevices()
    const selection = this.devicePreferences
      ? resolveSelectionDevices(devices, this.devicePreferences)
      : resolveSelectionDevices(devices, {
          cameraId: null,
          cameraLabel: null,
          microphoneId: null,
          microphoneLabel: null,
          speakerId: null,
        })
    this.devicePreferences = selection
    return { devices, selection }
  }

  private reportError(err: unknown, fallback: string): void {
    const message = err instanceof Error ? err.message : mediaErrorMessage(err, fallback)
    this.options.onError?.(new Error(message))
  }

  private async joinRoom(): Promise<void> {
    if (!this.protoo) throw new Error('Protoo not connected')

    this.device = await mediasoupClient.Device.factory()

    const { routerRtpCapabilities } = (await this.protoo.request(
      'getRouterRtpCapabilities',
    )) as { routerRtpCapabilities: MediasoupTypes.RtpCapabilities }

    await this.device.load({ routerRtpCapabilities })

    this.unlockAutoplay()

    const sendInfo = (await this.protoo.request('createWebRtcTransport', {
      forceTcp: false,
      appData: { direction: 'producer' },
    })) as TransportInfo

    this.sendTransport = this.device.createSendTransport({
      id: sendInfo.transportId,
      iceParameters: sendInfo.iceParameters,
      iceCandidates: sendInfo.iceCandidates,
      dtlsParameters: { ...sendInfo.dtlsParameters, role: 'auto' },
    })

    this.sendTransport.on(
      'connect',
      (
        { dtlsParameters }: { dtlsParameters: MediasoupTypes.DtlsParameters },
        callback: () => void,
        errback: (error: Error) => void,
      ) => {
        this.protoo!
          .request('connectWebRtcTransport', {
            transportId: this.sendTransport!.id,
            dtlsParameters,
          })
          .then(callback)
          .catch(errback)
      },
    )

    this.sendTransport.on(
      'produce',
      async (
        {
          kind,
          rtpParameters,
          appData,
        }: {
          kind: MediasoupTypes.MediaKind
          rtpParameters: MediasoupTypes.RtpParameters
          appData: Record<string, unknown>
        },
        callback: (data: { id: string }) => void,
        errback: (error: Error) => void,
      ) => {
        try {
          const { producerId } = (await this.protoo!.request('produce', {
            transportId: this.sendTransport!.id,
            kind,
            rtpParameters,
            appData,
          })) as { producerId: string }
          callback({ id: producerId })
        } catch (error) {
          errback(error as Error)
        }
      },
    )

    const recvInfo = (await this.protoo.request('createWebRtcTransport', {
      forceTcp: false,
      appData: { direction: 'consumer' },
    })) as TransportInfo

    this.recvTransport = this.device.createRecvTransport({
      id: recvInfo.transportId,
      iceParameters: recvInfo.iceParameters,
      iceCandidates: recvInfo.iceCandidates,
      dtlsParameters: { ...recvInfo.dtlsParameters, role: 'auto' },
    })

    this.recvTransport.on(
      'connect',
      (
        { dtlsParameters }: { dtlsParameters: MediasoupTypes.DtlsParameters },
        callback: () => void,
        errback: (error: Error) => void,
      ) => {
        this.protoo!
          .request('connectWebRtcTransport', {
            transportId: this.recvTransport!.id,
            dtlsParameters,
          })
          .then(callback)
          .catch(errback)
      },
    )

    const { peers } = (await this.protoo.request('join', {
      displayName: this.options.displayName,
      device: getDeviceInfo(),
      rtpCapabilities: this.device.rtpCapabilities,
    })) as {
      peers: Array<{ peerId: string; displayName: string }>
    }

    for (const peer of peers) {
      if (peer.peerId === this.options.peerId) continue
      if (this.shouldExcludePeer(peer.peerId, peer.displayName)) continue
      this.ensureRemoteParticipant(peer.peerId, peer.displayName)
    }

    if (this.options.autoPublish !== false) {
      await this.publishProducers()
    }
  }

  private async handleProtooRequest(
    request: { method: string; data: Record<string, unknown> },
    accept: () => void,
    reject: (code: number, reason: string) => void,
  ): Promise<void> {
    if (request.method !== 'newConsumer') {
      reject(400, 'Unsupported request')
      return
    }

    await this.consumingQueue.push(async () => {
      if (!this.recvTransport) {
        reject(403, 'Cannot consume')
        return
      }

      const data = request.data as {
        peerId: string
        consumerId: string
        producerId: string
        kind: MediasoupTypes.MediaKind
        rtpParameters: MediasoupTypes.RtpParameters
        appData: { source?: string; sourceId?: string }
      }

      if (this.shouldExcludePeer(data.peerId)) {
        reject(403, 'Cannot consume system peer')
        return
      }

      try {
        const sourceId = data.appData?.sourceId
        const consumer = await this.recvTransport.consume({
          id: data.consumerId,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
          // Distinct MSID so multiple videos from one peer don't share a stream.
          streamId: sourceId ? `${data.peerId}-${sourceId}` : `${data.peerId}-av`,
          appData: { ...data.appData, peerId: data.peerId },
        })

        const participant = this.ensureRemoteParticipant(data.peerId, data.peerId)
        participant.consumers.set(consumer.id, consumer)

        consumer.on('transportclose', () => {
          participant.consumers.delete(consumer.id)
          this.emitParticipants()
        })

        accept()
        this.emitParticipants()
      } catch (error) {
        reject(500, String(error))
        this.options.onError?.(error as Error)
      }
    })
  }

  private async handleProtooNotification(notification: {
    method: string
    data: Record<string, unknown>
  }): Promise<void> {
    switch (notification.method) {
      case 'newPeer': {
        const peer = notification.data.peer as { peerId: string; displayName: string }
        if (
          peer.peerId !== this.options.peerId &&
          !this.shouldExcludePeer(peer.peerId, peer.displayName)
        ) {
          this.ensureRemoteParticipant(peer.peerId, peer.displayName)
          this.emitParticipants()
        }
        break
      }
      case 'peerClosed': {
        const { peerId } = notification.data as { peerId: string }
        this.remoteParticipants.delete(peerId)
        this.emitParticipants()
        break
      }
      case 'consumerClosed': {
        const { consumerId } = notification.data as { consumerId: string }
        for (const participant of this.remoteParticipants.values()) {
          const consumer = participant.consumers.get(consumerId)
          if (consumer) {
            consumer.close()
            participant.consumers.delete(consumerId)
            break
          }
        }
        this.emitParticipants()
        break
      }
      default:
        break
    }
  }

  private shouldExcludePeer(peerId: string, displayName?: string): boolean {
    return isCompositorPeer(peerId, {
      roomId: this.options.roomId,
      displayName,
    })
  }

  private ensureRemoteParticipant(peerId: string, displayName: string): RemoteParticipant {
    let participant = this.remoteParticipants.get(peerId)
    if (!participant) {
      participant = { peerId, displayName, consumers: new Map() }
      this.remoteParticipants.set(peerId, participant)
    } else if (displayName && displayName !== peerId) {
      participant.displayName = displayName
    }
    return participant
  }

  private emitParticipants(): void {
    const participants: ParticipantMedia[] = [
      {
        peerId: this.options.peerId,
        displayName: `${this.options.displayName} (You)`,
        audioTrack: this.micProducer?.track ?? undefined,
        videoTrack: this.webcamProducer?.track ?? undefined,
        audioEnabled: this.micEnabled,
        videoEnabled: this.webcamEnabled,
        isLocal: true,
      },
    ]

    for (const [sourceId, producer] of this.sourceProducers.entries()) {
      if (producer.closed) continue
      participants.push({
        peerId: sourceId,
        displayName: sourceId,
        videoTrack: producer.track ?? undefined,
        audioEnabled: false,
        videoEnabled: Boolean(producer.track),
        isLocal: true,
        sourceId,
      })
    }

    for (const [peerId, remote] of this.remoteParticipants.entries()) {
      if (this.shouldExcludePeer(peerId, remote.displayName)) {
        this.remoteParticipants.delete(peerId)
        continue
      }

      let audioTrack: MediaStreamTrack | undefined
      let videoTrack: MediaStreamTrack | undefined

      for (const consumer of remote.consumers.values()) {
        const consumerSourceId = (consumer.appData as { sourceId?: string }).sourceId
        if (consumer.kind === 'audio' && !consumerSourceId) {
          audioTrack = consumer.track
        }
        if (consumer.kind === 'video' && !consumerSourceId) {
          videoTrack = consumer.track
        }
      }

      participants.push({
        peerId: remote.peerId,
        displayName: remote.displayName,
        audioTrack,
        videoTrack,
        audioEnabled: Boolean(audioTrack?.enabled),
        videoEnabled: Boolean(videoTrack),
        isLocal: false,
      })

      for (const consumer of remote.consumers.values()) {
        const consumerSourceId = (consumer.appData as { sourceId?: string }).sourceId
        if (!consumerSourceId || consumer.kind !== 'video') continue
        participants.push({
          peerId: consumerSourceId,
          displayName: consumerSourceId,
          videoTrack: consumer.track,
          audioEnabled: false,
          videoEnabled: Boolean(consumer.track),
          isLocal: false,
          sourceId: consumerSourceId,
        })
      }
    }

    this.options.onParticipantsChange?.(participants)
  }

  private setState(state: ConnectionState): void {
    this.options.onStateChange?.(state)
  }

  private currentTrackDeviceId(track: MediaStreamTrack | null | undefined): string | undefined {
    return track?.getSettings().deviceId
  }

  /**
   * Hot-swap microphone device without closing the mediasoup producer.
   * No-op when the resolved device matches the track already in use.
   */
  private async replaceMicTrack(
    devices: Awaited<ReturnType<typeof enumerateMediaDevices>>,
    selection: DeviceSelection,
  ): Promise<void> {
    if (!this.micProducer || this.micProducer.closed) return

    const microphone = resolveMediaDevice(
      devices,
      {
        deviceId: selection.microphoneId,
        label: selection.microphoneLabel,
      },
      'audioinput',
    )
    if (!microphone) {
      throw new Error(deviceUnavailableMessage(selection, 'microphone'))
    }

    const currentId = this.currentTrackDeviceId(this.micProducer.track)
    if (currentId && currentId === microphone.deviceId) {
      return
    }

    const stream = await openAudioStream(microphone.deviceId, 'producer', {
      label: microphone.label,
    })
    const track = stream.getAudioTracks()[0]
    if (!track) {
      stopMediaStream(stream)
      throw new Error('No audio track was returned.')
    }

    const previousStream = this.micStream
    try {
      await this.micProducer.replaceTrack({ track })
    } catch (err) {
      stopMediaStream(stream)
      throw err
    }

    this.micStream = stream
    stopMediaStream(previousStream)
    this.emitParticipants()
  }

  /**
   * Hot-swap camera device without closing the mediasoup producer.
   * Keeps producerId stable so compositor does not soft-disable during scene switches.
   */
  private async replaceWebcamTrack(
    devices: Awaited<ReturnType<typeof enumerateMediaDevices>>,
    selection: DeviceSelection,
  ): Promise<void> {
    if (!this.webcamProducer || this.webcamProducer.closed) return

    const camera = resolveMediaDevice(
      devices,
      {
        deviceId: selection.cameraId,
        label: selection.cameraLabel,
      },
      'videoinput',
    )
    if (!camera) {
      throw new Error(deviceUnavailableMessage(selection, 'camera'))
    }

    const currentId = this.currentTrackDeviceId(this.webcamProducer.track)
    if (currentId && currentId === camera.deviceId) {
      return
    }

    const stream = await openVideoStream(camera.deviceId, 'producer', {
      label: camera.label,
    })
    const track = stream.getVideoTracks()[0]
    if (!track) {
      stopMediaStream(stream)
      throw new Error('No video track was returned.')
    }

    const previousStream = this.webcamStream
    try {
      await this.webcamProducer.replaceTrack({ track })
    } catch (err) {
      stopMediaStream(stream)
      throw err
    }

    this.webcamStream = stream
    stopMediaStream(previousStream)
    this.emitParticipants()
  }

  private stopMicStream(): void {
    stopMediaStream(this.micStream)
    this.micStream = null
  }

  private stopWebcamStream(): void {
    stopMediaStream(this.webcamStream)
    this.webcamStream = null
  }

  private stopSourceStream(sourceId: string): void {
    const stream = this.sourceStreams.get(sourceId)
    stopMediaStream(stream)
    this.sourceStreams.delete(sourceId)
  }

  private async stopSourceProducer(sourceId: string): Promise<void> {
    const producer = this.sourceProducers.get(sourceId)
    if (producer) {
      this.closeAndNotifyProducer(producer)
      this.sourceProducers.delete(sourceId)
    }
    this.stopSourceStream(sourceId)
    this.emitParticipants()
  }

  private unlockAutoplay(): void {
    try {
      const audioContext = new AudioContext()
      const buffer = audioContext.createBuffer(1, 1, 22050)
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
      void audioContext.close()
    } catch {
      // ignore — user may grant later
    }
  }
}

interface TransportInfo {
  transportId: string
  iceParameters: MediasoupTypes.IceParameters
  iceCandidates: MediasoupTypes.IceCandidate[]
  dtlsParameters: MediasoupTypes.DtlsParameters
}
