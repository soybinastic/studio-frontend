import type { DeviceSelection, MediaDeviceInfo } from '@/types/devices'

export interface DevicePreference {
  deviceId?: string | null
  label?: string | null
  groupId?: string | null
}

export function normalizeDeviceLabel(label: string): string {
  return label.trim().toLowerCase()
}

export function resolveMediaDevice(
  devices: MediaDeviceInfo[],
  pref: DevicePreference,
  kind: MediaDeviceInfo['kind'],
): MediaDeviceInfo | null {
  const list = devices.filter((d) => d.kind === kind)
  if (list.length === 0) return null

  if (pref.deviceId) {
    const byId = list.find((d) => d.deviceId === pref.deviceId)
    if (byId) return byId
  }

  if (pref.label) {
    const normalized = normalizeDeviceLabel(pref.label)
    const matches = list.filter((d) => normalizeDeviceLabel(d.label) === normalized)
    if (matches.length === 1) return matches[0]
    if (matches.length > 1 && pref.groupId) {
      const byGroup = matches.find((d) => d.groupId === pref.groupId)
      if (byGroup) return byGroup
    }
    if (matches.length > 0) return matches[0]
  }

  if (pref.deviceId || pref.label) {
    return null
  }

  return list[0] ?? null
}

export function selectionFromMediaDevice(
  device: MediaDeviceInfo,
  kind: 'camera' | 'microphone' | 'speaker',
): Partial<DeviceSelection> {
  if (kind === 'camera') {
    return { cameraId: device.deviceId, cameraLabel: device.label }
  }
  if (kind === 'microphone') {
    return { microphoneId: device.deviceId, microphoneLabel: device.label }
  }
  return { speakerId: device.deviceId }
}

export function resolveSelectionDevices(
  devices: MediaDeviceInfo[],
  selection: DeviceSelection,
): DeviceSelection {
  const hasCameraPref = Boolean(selection.cameraId || selection.cameraLabel)
  const hasMicPref = Boolean(selection.microphoneId || selection.microphoneLabel)

  const camera = resolveMediaDevice(
    devices,
    {
      deviceId: selection.cameraId,
      label: selection.cameraLabel,
    },
    'videoinput',
  )
  const microphone = resolveMediaDevice(
    devices,
    {
      deviceId: selection.microphoneId,
      label: selection.microphoneLabel,
    },
    'audioinput',
  )

  const cameras = devices.filter((d) => d.kind === 'videoinput')
  const mics = devices.filter((d) => d.kind === 'audioinput')
  const speakers = devices.filter((d) => d.kind === 'audiooutput')

  let speakerId = selection.speakerId
  if (speakerId && speakerId !== 'default' && !speakers.some((d) => d.deviceId === speakerId)) {
    speakerId = speakers[0]?.deviceId ?? 'default'
  } else if (!speakerId) {
    speakerId = speakers[0]?.deviceId ?? 'default'
  }

  return {
    cameraId: camera?.deviceId ?? (hasCameraPref ? null : cameras[0]?.deviceId ?? null),
    cameraLabel: camera?.label ?? selection.cameraLabel,
    microphoneId: microphone?.deviceId ?? (hasMicPref ? null : mics[0]?.deviceId ?? null),
    microphoneLabel: microphone?.label ?? selection.microphoneLabel,
    speakerId,
  }
}

export function deviceUnavailableMessage(
  selection: DeviceSelection,
  kind: 'camera' | 'microphone',
): string {
  if (kind === 'camera') {
    return selection.cameraLabel
      ? `${selection.cameraLabel} is not available. Check that it is connected or running.`
      : 'Camera is not available.'
  }
  return selection.microphoneLabel
    ? `${selection.microphoneLabel} is not available.`
    : 'Microphone is not available.'
}
