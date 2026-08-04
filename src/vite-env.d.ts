/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMPOSITOR_API_URL: string
  readonly VITE_PERSISTENCE_API_URL?: string
  readonly VITE_TENANT_ID?: string
  readonly VITE_TENANT_NAME?: string
  readonly VITE_PERSISTENCE_ENABLED?: string
  readonly VITE_STREAM_DESTINATION_MODAL?: string
  readonly VITE_STUDIO_CHAT_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'protoo-client' {
  export class WebSocketTransport {
    constructor(url: string)
  }

  export class Peer {
    constructor(transport: WebSocketTransport)
    on(event: string, listener: (...args: unknown[]) => void): void
    close(): void
    request(method: string, data?: unknown): Promise<unknown>
  }

  const protooClient: {
    WebSocketTransport: typeof WebSocketTransport
    Peer: typeof Peer
  }

  export default protooClient
}
