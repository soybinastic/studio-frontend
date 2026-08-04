import type { SocialCommentPayload, SocialPlatform } from '@/types/studio-chat-signal'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitch: 'Twitch',
}

const ACCOUNT_TYPE_LABELS: Record<
  NonNullable<SocialCommentPayload['account']['accountType']>,
  string
> = {
  page: 'Page',
  profile: 'Profile',
  channel: 'Channel',
}

export function formatPlatformList(platforms: SocialPlatform[]): string {
  if (platforms.length === 0) return ''
  const labels = platforms.map((p) => PLATFORM_LABELS[p])
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
  if (comment.source === 'host_outbound') {
    return `You · ${PLATFORM_LABELS[comment.platform]}`
  }

  const accountLabel = formatSocialAccountLabel(comment)
  if (accountLabel) {
    return `${comment.from.name} (${accountLabel})`
  }
  return comment.from.name
}
