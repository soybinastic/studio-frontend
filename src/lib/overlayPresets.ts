export interface OverlayPreset {
  id: string
  label: string
  url: string
}

export const OVERLAY_PRESETS: OverlayPreset[] = [
  {
    id: 'color-doodle',
    label: 'Color doodle',
    url: 'https://studio-assets.b-cdn.net/overlay/ace0c072-df46-44c1-9b86-3113fa8d669d.png',
  },
  {
    id: 'botanical-frame',
    label: 'Botanical frame',
    url: 'https://img.magnific.com/free-psd/dried-flower-frame-botanical-elegance_632498-26119.jpg?semt=ais_hybrid&w=740&q=80',
  },
  {
    id: 'soft-glow',
    label: 'Soft glow',
    url: 'https://static.vecteezy.com/system/resources/thumbnails/082/050/366/small/abstract-digital-background-with-glowing-particles-and-soft-gradients-free-video.jpg',
  },
]

export const FULL_FRAME_OVERLAY_POSITION = { x: 0, y: 0, w: 1920, h: 1080 } as const
