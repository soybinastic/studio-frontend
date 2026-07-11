export interface DeviceInfo {
  flag: string
  name: string
  version: string
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent

  if (/Chrome|Chromium/i.test(ua) && !/Edg/i.test(ua)) {
    return { flag: 'chrome', name: 'Chrome', version: 'unknown' }
  }
  if (/Firefox/i.test(ua)) {
    return { flag: 'firefox', name: 'Firefox', version: 'unknown' }
  }
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return { flag: 'safari', name: 'Safari', version: 'unknown' }
  }
  if (/Edg/i.test(ua)) {
    return { flag: 'edge', name: 'Edge', version: 'unknown' }
  }

  return { flag: 'unknown', name: 'Browser', version: 'unknown' }
}
