import { ApiError } from '@/api/client'

const PERSISTENCE_API_BASE =
  import.meta.env.VITE_PERSISTENCE_API_URL ?? 'http://localhost:8001/api/persistence'

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string }
    return data.detail ?? response.statusText
  } catch {
    return response.statusText
  }
}

export async function persistenceRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${PERSISTENCE_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await parseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
