export interface MediaDeviceInfo {
  deviceId: string
  label: string
  kind: 'videoinput' | 'audioinput' | 'audiooutput'
}

export interface DeviceSelection {
  cameraId: string | null
  microphoneId: string | null
  speakerId: string | null
}

export interface DeviceState {
  devices: MediaDeviceInfo[]
  selection: DeviceSelection
  isEnumerating: boolean
  isSetupComplete: boolean
  micMuted: boolean
  cameraEnabled: boolean
  previewStream: MediaStream | null
  audioLevel: number
}

export type DeviceAction =
  | { type: 'SET_DEVICES'; devices: MediaDeviceInfo[] }
  | { type: 'SET_SELECTION'; selection: Partial<DeviceSelection> }
  | { type: 'SET_ENUMERATING'; isEnumerating: boolean }
  | { type: 'SET_SETUP_COMPLETE'; isSetupComplete: boolean }
  | { type: 'SET_MIC_MUTED'; micMuted: boolean }
  | { type: 'SET_CAMERA_ENABLED'; cameraEnabled: boolean }
  | { type: 'SET_PREVIEW_STREAM'; previewStream: MediaStream | null }
  | { type: 'SET_AUDIO_LEVEL'; audioLevel: number }
