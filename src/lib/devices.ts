import type { DeviceSelection, MediaDeviceInfo } from '@/types/devices'

export function mapMediaDevices(raw: MediaDeviceInfo[]): MediaDeviceInfo[] {
  return raw
    .filter((d) => d.deviceId !== '')
    .map((d) => ({
      deviceId: d.deviceId,
      label:
        d.label ||
        `${d.kind.replace('input', '').replace('output', '')} (${d.deviceId.slice(0, 8)})`,
      kind: d.kind,
    }))
}

export function pickDefaultSelection(
  devices: MediaDeviceInfo[],
  prev: DeviceSelection = { cameraId: null, microphoneId: null, speakerId: null },
): DeviceSelection {
  const cameras = devices.filter((d) => d.kind === 'videoinput')
  const mics = devices.filter((d) => d.kind === 'audioinput')
  const speakers = devices.filter((d) => d.kind === 'audiooutput')

  return {
    cameraId:
      prev.cameraId && cameras.some((d) => d.deviceId === prev.cameraId)
        ? prev.cameraId
        : cameras[0]?.deviceId ?? null,
    microphoneId:
      prev.microphoneId && mics.some((d) => d.deviceId === prev.microphoneId)
        ? prev.microphoneId
        : mics[0]?.deviceId ?? null,
    speakerId:
      prev.speakerId && speakers.some((d) => d.deviceId === prev.speakerId)
        ? prev.speakerId
        : speakers[0]?.deviceId ?? null,
  }
}

export async function enumerateMediaDevices(): Promise<MediaDeviceInfo[]> {
  const raw = await navigator.mediaDevices.enumerateDevices()
  return mapMediaDevices(
    raw.map((d) => ({
      deviceId: d.deviceId,
      label: d.label,
      kind: d.kind as MediaDeviceInfo['kind'],
    })),
  )
}

export function hasSceneDevices(devices: DeviceSelection): boolean {
  return Boolean(devices.cameraId || devices.microphoneId || devices.speakerId)
}
