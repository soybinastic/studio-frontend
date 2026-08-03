import { DestinationPlatform as Platform } from '@/types/destinations'

export interface RtmpPlatformPreset {
  id: string
  name: string
  description: string
  brandColor: string
  rtmpUrlPlaceholder: string
  streamKeyPlaceholder?: string
  streamKeyHelpUrl?: string
}

export const OAUTH_DESTINATION_PLATFORMS = new Set<string>([
  Platform.YOUTUBE,
  Platform.FACEBOOK,
  Platform.TWITCH,
])

export const RTMP_PLATFORM_PRESETS: RtmpPlatformPreset[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Stream with RTMP URL and stream key from X Live Producer.',
    brandColor: '#000000',
    rtmpUrlPlaceholder: 'rtmps://global-live.mux.com/live/<stream-key>',
    streamKeyHelpUrl: 'https://help.x.com/en/using-x/how-to-use-live-producer#RTMP',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Broadcast live to TikTok with your ingest URL and stream key.',
    brandColor: '#010101',
    rtmpUrlPlaceholder: 'rtmps://push-rtmp-global.tiktok.com/live/',
    streamKeyHelpUrl: 'https://restream.io/learn/platforms/how-to-find-tiktok-stream-key/',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram Live Producer using RTMP credentials.',
    brandColor: '#E4405F',
    rtmpUrlPlaceholder: 'rtmps://live-upload.instagram.com:443/rtmp/',
    streamKeyHelpUrl: 'https://about.instagram.com/blog/tips-and-tricks/instagram-live-producer',
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    description: 'Stream to Vimeo Live with RTMP ingest settings.',
    brandColor: '#1AB7EA',
    rtmpUrlPlaceholder: 'rtmps://rtmp-global-live.cloud.vimeo.com/live/',
    streamKeyHelpUrl:
      'https://support.proclaim.logos.com/hc/en-us/articles/19864449882893-How-To-Find-Your-Stream-URL-And-Stream-Key-In-Vimeo',
  },
  {
    id: 'wowza',
    name: 'Wowza',
    description: 'Send output to a Wowza Streaming Engine or Cloud target.',
    brandColor: '#EE9624',
    rtmpUrlPlaceholder: 'rtmp://your-server.example.com/live/',
  },
  {
    id: 'akamai',
    name: 'Akamai',
    description: 'Publish to an Akamai RTMP ingest endpoint.',
    brandColor: '#0099CC',
    rtmpUrlPlaceholder: 'rtmp://your-entrypoint.akamaihd.net/live/',
  },
  {
    id: 'huya',
    name: 'Huya',
    description: 'Stream to Huya with your RTMP URL and stream key.',
    brandColor: '#FF9600',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.huya.com/live/',
  },
  {
    id: 'trovo',
    name: 'Trovo',
    description: 'Go live on Trovo using RTMP credentials.',
    brandColor: '#1BD96C',
    rtmpUrlPlaceholder: 'rtmp://livepush.trovo.live/live/',
    streamKeyHelpUrl: 'https://support.trovo.live/category/1/article/777',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Stream to Amazon Live with RTMP ingest details.',
    brandColor: '#FF9900',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.amazonaws.com/live/',
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    description: 'Broadcast to Bilibili via RTMP.',
    brandColor: '#00A1D6',
    rtmpUrlPlaceholder: 'rtmp://live-push.bilivideo.com/live-bvc/',
  },
  {
    id: 'ebay',
    name: 'EBay',
    description: 'Stream to eBay Live with RTMP settings.',
    brandColor: '#E53238',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.ebay.com/live/',
  },
  {
    id: 'steam',
    name: 'Steam',
    description: 'Broadcast to Steam with RTMP ingest credentials.',
    brandColor: '#171A21',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.steamcontent.com/live/',
  },
  {
    id: 'dailymotion',
    name: 'Daily Motion',
    description: 'Stream to Dailymotion Live via RTMP.',
    brandColor: '#0066DC',
    rtmpUrlPlaceholder: 'rtmp://publish.dailymotion.com/publish-dm/',
    streamKeyHelpUrl:
      'https://faq.dailymotion.com/hc/en-us/articles/115009103088-Create-and-configure-a-live-stream',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Go live on LinkedIn with RTMP stream URL and key.',
    brandColor: '#0A66C2',
    rtmpUrlPlaceholder: 'rtmps://rtmp.linkedin.com/live/',
    streamKeyHelpUrl: 'https://www.linkedin.com/help/linkedin/answer/a564446',
  },
  {
    id: 'douyu',
    name: 'Douyu',
    description: 'Stream to Douyu using RTMP credentials.',
    brandColor: '#FF5F23',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.douyu.com/live/',
  },
  {
    id: 'afreeca_tv',
    name: 'Afreeca TV',
    description: 'Broadcast to AfreecaTV with RTMP ingest settings.',
    brandColor: '#0545FF',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.afreecatv.com/live/',
    streamKeyHelpUrl:
      'https://afreecatvglobal.wordpress.com/2017/07/19/afreecatv-broadcasting-starter-guide/',
  },
  {
    id: 'mlg',
    name: 'Major League Gaming',
    description: 'Stream to MLG with RTMP URL and stream key.',
    brandColor: '#FFD800',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.majorleaguegaming.com/live/',
  },
  {
    id: 'picarto',
    name: 'Picarto',
    description: 'Go live on Picarto with RTMP ingest details.',
    brandColor: '#1DA456',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.picarto.tv/live/',
  },
  {
    id: 'dlive',
    name: 'DLive',
    description: 'Broadcast to DLive using RTMP credentials.',
    brandColor: '#FFD300',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.dlive.tv/live/',
  },
  {
    id: 'kakao_tv',
    name: 'Kakao TV',
    description: 'Stream to Kakao TV with RTMP ingest settings.',
    brandColor: '#FEE500',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.kakao.com/live/',
  },
  {
    id: 'fc2_live',
    name: 'FC2 Live',
    description: 'Go live on FC2 Live via RTMP.',
    brandColor: '#0078C8',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.fc2.com/live/',
  },
  {
    id: 'naver_tv',
    name: 'Naver TV',
    description: 'Stream to Naver TV with RTMP credentials.',
    brandColor: '#03C75A',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.naver.com/live/',
  },
  {
    id: 'vaughn_live',
    name: 'Vaughn Live',
    description: 'Broadcast to Vaughn Live using RTMP.',
    brandColor: '#6441A5',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.vaughnlive.tv/live/',
  },
  {
    id: 'mixcloud',
    name: 'Mixcloud',
    description: 'Stream to Mixcloud Live with RTMP ingest details.',
    brandColor: '#5000FF',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.mixcloud.com/live/',
  },
  {
    id: 'etsy',
    name: 'Etsy',
    description: 'Go live on Etsy with RTMP stream settings.',
    brandColor: '#F56400',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.etsy.com/live/',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Stream to Shopify Live with RTMP credentials.',
    brandColor: '#96BF48',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.shopify.com/live/',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Broadcast to Telegram Live using RTMP.',
    brandColor: '#26A5E4',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.telegram.org/live/',
  },
  {
    id: 'nonolive',
    name: 'Nonolive',
    description: 'Stream to Nonolive with RTMP URL and stream key.',
    brandColor: '#FF4455',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.nonolive.com/live/',
  },
  {
    id: 'nimo_tv',
    name: 'Nimo TV',
    description: 'Go live on Nimo TV via RTMP ingest.',
    brandColor: '#7B61FF',
    rtmpUrlPlaceholder: 'rtmp://your-ingest.nimo.tv/live/',
  },
  {
    id: 'kick',
    name: 'Kick',
    description: 'Stream to Kick with your RTMP URL and stream key.',
    brandColor: '#53FC18',
    rtmpUrlPlaceholder: 'rtmps://fa723fc1b171.global-contribute.live-video.net/app/',
  },
]

export const RTMP_PRESET_BY_ID = Object.fromEntries(
  RTMP_PLATFORM_PRESETS.map((preset) => [preset.id, preset]),
) as Record<string, RtmpPlatformPreset>

export const CUSTOM_RTMP_PRESET: RtmpPlatformPreset = {
  id: Platform.CUSTOM_RTMP,
  name: 'Custom RTMP',
  description: 'Connect using any RTMP or RTMPS server URL and stream key.',
  brandColor: 'var(--primary)',
  rtmpUrlPlaceholder: 'rtmp://live.example.com/app',
}

/** Presets shown in go-live one-time destination dropdown (includes major OAuth targets). */
export const GO_LIVE_MANUAL_RTMP_PRESETS = [
  { label: 'Twitch', placeholder: 'rtmp://live.twitch.tv/app/<stream-key>' },
  { label: 'YouTube', placeholder: 'rtmp://a.rtmp.youtube.com/live2/<stream-key>' },
  { label: 'Facebook', placeholder: 'rtmps://live-api-s.facebook.com:443/rtmp/<stream-key>' },
  ...RTMP_PLATFORM_PRESETS.map((preset) => ({
    label: preset.name,
    placeholder: preset.rtmpUrlPlaceholder,
  })),
  { label: 'Custom', placeholder: 'rtmp://live.example.com/app/stream-key' },
] as const

export function isRtmpPresetPlatform(platform: string): boolean {
  return platform in RTMP_PRESET_BY_ID
}

export function isManualRtmpPlatform(platform: string): boolean {
  return platform === Platform.CUSTOM_RTMP || isRtmpPresetPlatform(platform)
}

export function isOAuthDestinationPlatform(platform: string): boolean {
  return OAUTH_DESTINATION_PLATFORMS.has(platform)
}

export function getRtmpPreset(platform: string): RtmpPlatformPreset | undefined {
  if (platform === Platform.CUSTOM_RTMP) {
    return CUSTOM_RTMP_PRESET
  }
  return RTMP_PRESET_BY_ID[platform]
}

export function getStreamingPlatformLabel(platform: string): string {
  return getRtmpPreset(platform)?.name ?? platform.replace(/_/g, ' ')
}

export function getStreamingPlatformBrandColor(platform: string): string {
  return getRtmpPreset(platform)?.brandColor ?? 'var(--primary)'
}
