import type { ChatGraphic } from '@/types/graphics'
import type { SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'
import { MESSAGE_GROUP_WINDOW_MS, getInitials } from '@/components/studio/chat/chatUtils'

/** Compositor chat panel renders at most this many lines. */
export const CHAT_OVERLAY_MESSAGE_LIMIT = 20

export type SocialPlatformFilter = 'all' | SocialPlatform

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitch: 'Twitch',
}

export const PLATFORM_CHIP_COLORS: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  youtube: 'bg-red-500/15 text-red-700 dark:text-red-300',
  twitch: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
}

export const PLATFORM_BUBBLE_ACCENT: Record<SocialPlatform, string> = {
  facebook: 'border-l-blue-500',
  youtube: 'border-l-red-500',
  twitch: 'border-l-purple-500',
}

const ACCOUNT_TYPE_LABELS: Record<
  NonNullable<SocialCommentPayload['account']['accountType']>,
  string
> = {
  page: 'Page',
  profile: 'Profile',
  channel: 'Channel',
}

export function isHostOutboundComment(comment: SocialCommentPayload): boolean {
  return comment.source === 'host_outbound'
}

export function getSocialCommentTimestamp(comment: SocialCommentPayload, fallbackIndex: number): number {
  return comment.createdAt ?? fallbackIndex
}

export function sortSocialComments(comments: SocialCommentPayload[]): SocialCommentPayload[] {
  return [...comments].sort((left, right) => {
    const leftIndex = comments.indexOf(left)
    const rightIndex = comments.indexOf(right)
    return getSocialCommentTimestamp(left, leftIndex) - getSocialCommentTimestamp(right, rightIndex)
  })
}

export function filterSocialComments(
  comments: SocialCommentPayload[],
  platformFilter: SocialPlatformFilter,
): SocialCommentPayload[] {
  if (platformFilter === 'all') {
    return comments
  }
  return comments.filter((comment) => comment.platform === platformFilter)
}

export function getSocialPlatformsInComments(comments: SocialCommentPayload[]): SocialPlatform[] {
  const platforms = new Set<SocialPlatform>()
  for (const comment of comments) {
    platforms.add(comment.platform)
  }
  return [...platforms]
}

export function shouldGroupSocialComments(
  previous: SocialCommentPayload | undefined,
  current: SocialCommentPayload,
  previousIndex: number,
  currentIndex: number,
): boolean {
  if (!previous) return false
  if (isHostOutboundComment(previous) !== isHostOutboundComment(current)) return false
  if (previous.platform !== current.platform) return false
  if (previous.from.name !== current.from.name) return false

  const previousAt = getSocialCommentTimestamp(previous, previousIndex)
  const currentAt = getSocialCommentTimestamp(current, currentIndex)
  return currentAt - previousAt <= MESSAGE_GROUP_WINDOW_MS
}

export function formatPlatformList(platforms: SocialPlatform[]): string {
  if (platforms.length === 0) return ''
  const labels = platforms.map((platform) => PLATFORM_LABELS[platform])
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`
}

export function formatSocialAccountLabel(comment: SocialCommentPayload): string | null {
  const accountName = comment.account?.name?.trim()
  if (!accountName) return null

  const accountType = comment.account?.accountType
  if (accountType) {
    return `${ACCOUNT_TYPE_LABELS[accountType]} · ${accountName}`
  }

  return accountName
}

export function formatSocialSenderLine(comment: SocialCommentPayload): string {
  if (isHostOutboundComment(comment)) {
    return `You · ${PLATFORM_LABELS[comment.platform]}`
  }

  const accountLabel = formatSocialAccountLabel(comment)
  if (accountLabel) {
    return `${comment.from.name} (${accountLabel})`
  }
  return comment.from.name
}

export function formatSocialSenderName(comment: SocialCommentPayload): string {
  if (isHostOutboundComment(comment)) {
    return 'You'
  }
  return comment.from.name
}

export function getSocialCommentInitials(comment: SocialCommentPayload): string {
  return getInitials(formatSocialSenderName(comment))
}

export function socialCommentsToOverlayMessages(
  comments: SocialCommentPayload[],
): ChatGraphic['messages'] {
  return sortSocialComments(comments)
    .slice(-CHAT_OVERLAY_MESSAGE_LIMIT)
    .map((comment) => ({
      author: `${formatSocialSenderName(comment)} · ${PLATFORM_LABELS[comment.platform]}`,
      text: comment.message,
    }))
}
