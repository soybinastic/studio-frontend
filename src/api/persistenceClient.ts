import { ApiError, formatApiErrorMessage } from '@/api/client'

const PERSISTENCE_API_BASE =
  import.meta.env.VITE_PERSISTENCE_API_URL ?? 'http://localhost:8001/api/persistence'

async function parseError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    return formatApiErrorMessage(data, response.status, response.statusText)
  } catch {
    return response.statusText.trim() || `Request failed (${response.status})`
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
