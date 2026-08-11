import type { DeviceSelection, MediaDeviceInfo } from '@/types/devices'
import { EMPTY_DEVICE_SELECTION } from '@/types/devices'
import { resolveSelectionDevices } from '@/lib/resolveDevice'

export function mapMediaDevices(raw: MediaDeviceInfo[]): MediaDeviceInfo[] {
  return raw
    .filter((d) => d.deviceId !== '')
    .map((d) => ({
      deviceId: d.deviceId,
      label:
        d.label ||
        `${d.kind.replace('input', '').replace('output', '')} (${d.deviceId.slice(0, 8)})`,
      kind: d.kind,
      groupId: d.groupId,
    }))
}

export function pickDefaultSelection(
  devices: MediaDeviceInfo[],
  prev: DeviceSelection,
): DeviceSelection {
  return resolveSelectionDevices(devices, prev)
}

export async function enumerateMediaDevices(): Promise<MediaDeviceInfo[]> {
  const raw = await navigator.mediaDevices.enumerateDevices()
  return mapMediaDevices(
    raw.map((d) => ({
      deviceId: d.deviceId,
      label: d.label,
      kind: d.kind as MediaDeviceInfo['kind'],
      groupId: d.groupId,
    })),
  )
}

export function hasSceneDevices(devices: DeviceSelection): boolean {
  return Boolean(
    devices.cameraId ||
      devices.cameraLabel ||
      devices.microphoneId ||
      devices.microphoneLabel ||
      devices.speakerId,
  )
}

export function normalizeDeviceSelection(raw: Partial<DeviceSelection> | null | undefined): DeviceSelection {
  if (!raw) return { ...EMPTY_DEVICE_SELECTION }
  return {
    cameraId: raw.cameraId ?? null,
    cameraLabel: raw.cameraLabel ?? null,
    microphoneId: raw.microphoneId ?? null,
    microphoneLabel: raw.microphoneLabel ?? null,
    speakerId: raw.speakerId ?? null,
  }
}

/** Active scene devices first, then tenant-level fallback. */
export function resolvePreferredSetupDevices(
  scenes: Array<{ is_active?: boolean; devices?: DeviceSelection | null }>,
  tenantDevices?: DeviceSelection | null,
): DeviceSelection | null {
  const active = scenes.find((scene) => scene.is_active)
  if (active?.devices && hasSceneDevices(active.devices)) {
    return normalizeDeviceSelection(active.devices)
  }
  if (tenantDevices && hasSceneDevices(tenantDevices)) {
    return normalizeDeviceSelection(tenantDevices)
  }
  return null
}
