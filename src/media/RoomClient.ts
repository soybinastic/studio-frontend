import { AwaitQueue } from 'awaitqueue'
import * as mediasoupClient from 'mediasoup-client'
import type { types as MediasoupTypes } from 'mediasoup-client'
import protooClient from 'protoo-client'
import { getDeviceInfo } from '@/media/deviceInfo'
import type { ConnectionState, ParticipantMedia } from '@/types/session'

export interface RoomClientOptions {
  roomId: string
  peerId: string
  displayName: string
  mediasoupWsUrl: string
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
  private webcamProducer: MediasoupTypes.Producer | null = null
  private readonly remoteParticipants = new Map<string, RemoteParticipant>()
  private readonly consumingQueue = new AwaitQueue()
  private micEnabled = false
  private webcamEnabled = false

  constructor(options: RoomClientOptions) {
    this.options = options
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

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const track = stream.getAudioTracks()[0]

    this.micProducer = await this.sendTransport.produce({
      track,
      appData: { source: 'audio' },
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
    this.micProducer.close()
    this.micProducer = null
    this.micEnabled = false
    this.emitParticipants()
  }

  async enableWebcam(): Promise<void> {
    if (!this.sendTransport || !this.device?.canProduce('video') || this.webcamProducer) {
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    })
    const track = stream.getVideoTracks()[0]

    this.webcamProducer = await this.sendTransport.produce({
      track,
      appData: { source: 'video' },
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
    this.webcamProducer.close()
    this.webcamProducer = null
    this.webcamEnabled = false
    this.emitParticipants()
  }

  async toggleMic(): Promise<void> {
    if (this.micEnabled) {
      await this.disableMic()
    } else {
      await this.enableMic()
    }
  }

  async toggleWebcam(): Promise<void> {
    if (this.webcamEnabled) {
      await this.disableWebcam()
    } else {
      await this.enableWebcam()
    }
  }

  close(): void {
    if (this.closed) return
    this.closed = true

    this.micProducer?.close()
    this.webcamProducer?.close()
    this.sendTransport?.close()
    this.recvTransport?.close()
    this.protoo?.close()

    this.micProducer = null
    this.webcamProducer = null
    this.sendTransport = null
    this.recvTransport = null
    this.protoo = null
    this.remoteParticipants.clear()
    this.setState('disconnected')
  }

  private async joinRoom(): Promise<void> {
    if (!this.protoo) throw new Error('Protoo not connected')

    this.device = await mediasoupClient.Device.factory()

    const { routerRtpCapabilities } = (await this.protoo.request(
      'getRouterRtpCapabilities',
    )) as { routerRtpCapabilities: MediasoupTypes.RtpCapabilities }

    await this.device.load({ routerRtpCapabilities })

    // Autoplay unlock hack for remote audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const track = stream.getAudioTracks()[0]
      track.enabled = false
      window.setTimeout(() => track.stop(), 120000)
    } catch {
      // ignore — user may grant later
    }

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
        }: { kind: MediasoupTypes.MediaKind; rtpParameters: MediasoupTypes.RtpParameters; appData: Record<string, unknown> },
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
      this.ensureRemoteParticipant(peer.peerId, peer.displayName)
    }

    await this.enableMic()
    await this.enableWebcam()
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
        appData: { source?: string }
      }

      try {
        const consumer = await this.recvTransport.consume({
          id: data.consumerId,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters,
          streamId: `${data.peerId}-av`,
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
        if (peer.peerId !== this.options.peerId) {
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

    for (const remote of this.remoteParticipants.values()) {
      let audioTrack: MediaStreamTrack | undefined
      let videoTrack: MediaStreamTrack | undefined

      for (const consumer of remote.consumers.values()) {
        if (consumer.kind === 'audio') audioTrack = consumer.track
        if (consumer.kind === 'video') videoTrack = consumer.track
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
    }

    this.options.onParticipantsChange?.(participants)
  }

  private setState(state: ConnectionState): void {
    this.options.onStateChange?.(state)
  }
}

interface TransportInfo {
  transportId: string
  iceParameters: MediasoupTypes.IceParameters
  iceCandidates: MediasoupTypes.IceCandidate[]
  dtlsParameters: MediasoupTypes.DtlsParameters
}
