export interface BackgroundMusicPreset {
  uuid: string
  title: string
  source: string
  default: boolean
  size: number
  meta_data: unknown | null
}

/** @deprecated Defaults now come from persistence music_catalog. Kept for type reuse. */
export const BACKGROUND_MUSIC_PRESETS: BackgroundMusicPreset[] = []

export const DEFAULT_BACKGROUND_MUSIC_PRESETS: BackgroundMusicPreset[] = []

export function findBackgroundMusicPreset(uuid: string): BackgroundMusicPreset | undefined {
  return BACKGROUND_MUSIC_PRESETS.find((preset) => preset.uuid === uuid)
}
