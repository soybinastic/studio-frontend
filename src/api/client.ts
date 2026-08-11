const API_BASE = import.meta.env.VITE_COMPOSITOR_API_URL ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

function formatErrorPart(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (Array.isArray(value)) {
    const parts = value.map(formatErrorPart).filter((part): part is string => Boolean(part))
    return parts.length > 0 ? parts.join(', ') : null
  }
  if (value && typeof value === 'object') {
    const parts: string[] = []
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const formatted = formatErrorPart(nested)
      if (formatted) parts.push(`${key}: ${formatted}`)
    }
    return parts.length > 0 ? parts.join('; ') : null
  }
  return null
}

/** Build a non-empty message from DRF / JSON error bodies (never blank toasts). */
export function formatApiErrorMessage(
  data: unknown,
  status: number,
  statusText: string,
): string {
  const fallback = statusText.trim() || `Request failed (${status})`
  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  const detailMessage = formatErrorPart(record.detail)
  if (detailMessage) return detailMessage

  const fieldParts: string[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key === 'detail') continue
    const formatted = formatErrorPart(value)
    if (formatted) fieldParts.push(`${key}: ${formatted}`)
  }
  if (fieldParts.length > 0) return fieldParts.join('; ')

  return fallback
}

async function parseError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    return formatApiErrorMessage(data, response.status, response.statusText)
  } catch {
    return response.statusText.trim() || `Request failed (${response.status})`
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
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
