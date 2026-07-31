export interface QrPreset {
  id: string
  label: string
  url: string
}

export const QR_PRESETS: QrPreset[] = [
  {
    id: 'classic-qr',
    label: 'Classic QR',
    url: 'https://pngimg.com/uploads/qr_code/qr_code_PNG34.png',
  },
  {
    id: 'coffee-qr',
    label: 'Coffee QR',
    url: 'https://www.shutterstock.com/image-vector/cup-coffee-tea-qr-code-260nw-2221642517.jpg',
  },
]
