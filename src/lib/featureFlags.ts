function envFlag(value: string | undefined): boolean {
  if (!value) return false
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase())
}

/** When true, host must pick RTMP destinations in a modal before going live. */
export const streamDestinationModalEnabled = envFlag(
  import.meta.env.VITE_STREAM_DESTINATION_MODAL,
)
