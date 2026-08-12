import type { PreRecordedSourceSettings, Source, SourceState } from '@/types/sources'

/** Parse CMS duration strings like "01:23", "1:23:45", or seconds ("83"). */
export function parseDurationToMs(raw: string | null | undefined): number {
  if (!raw) return 0
  const trimmed = raw.trim()
  if (!trimmed) return 0

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.max(0, Math.round(Number(trimmed) * 1000))
  }

  const parts = trimmed.split(':').map((part) => Number(part))
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return Math.round((minutes * 60 + seconds) * 1000)
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000)
  }
  return 0
}

export function durationMsFromSource(source: Source): number {
  const settings = source.settings as PreRecordedSourceSettings | undefined
  return parseDurationToMs(settings?.duration)
}

export function formatPlaybackClock(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function isPrerecordedPlaying(state: SourceState): boolean {
  return state === 'ACTIVE' || state === 'LOADING'
}

export function clampPlaybackMs(positionMs: number, durationMs: number): number {
  const safe = Math.max(0, positionMs)
  if (durationMs <= 0) return safe
  return Math.min(safe, durationMs)
}
