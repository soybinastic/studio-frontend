export interface BackgroundPreset {
  id: string
  label: string
  url: string
  type: 'image' | 'video'
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'canva-grid',
    label: 'Blue grid',
    url: 'https://template.canva.com/EAGbPhlxOcM/1/0/1600w-5ys5JpmtHqg.jpg',
    type: 'image',
  },
  {
    id: 'natural-boho',
    label: 'Natural boho',
    url: 'https://static.vecteezy.com/system/resources/thumbnails/010/596/270/small/natural-theme-wallpaper-design-aesthetic-wall-decoration-free-vector.jpg',
    type: 'image',
  },
  {
    id: 'tropical-leaves',
    label: 'Tropical leaves',
    url: 'https://static.vecteezy.com/system/resources/previews/007/701/879/non_2x/seamless-pattern-with-aesthetic-color-leaf-elements-used-for-fabric-design-wallpaper-vector.jpg',
    type: 'image',
  },
]
