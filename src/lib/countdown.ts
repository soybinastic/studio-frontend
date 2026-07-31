export interface CountdownState {
  active: boolean
  started_at: string
  duration_seconds: number
  target_scene_id: string
  source_scene_id: string
}

export function countdownSecondsRemaining(state: CountdownState, nowMs = Date.now()): number {
  const startedMs = Date.parse(state.started_at)
  if (Number.isNaN(startedMs)) return 0
  const elapsed = Math.max(0, (nowMs - startedMs) / 1000)
  return Math.max(0, Math.ceil(state.duration_seconds - elapsed))
}

export function formatCountdownLabel(secondsRemaining: number): string {
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
