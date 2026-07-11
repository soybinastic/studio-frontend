/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMPOSITOR_API_URL: string
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
