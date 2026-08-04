import type { ChatMessageDto } from '@/types/chat-message'

export const MESSAGE_GROUP_WINDOW_MS = 2 * 60 * 1000

export function getInitials(name: string): string {
  return name
    .replace(' (You)', '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function shouldGroupWithPrevious(
  previous: ChatMessageDto | undefined,
  current: ChatMessageDto,
): boolean {
  if (!previous) return false
  if (previous.senderId !== current.senderId) return false
  if (previous.visibility !== current.visibility) return false
  if (previous.status === 'hidden' || current.status === 'hidden') return false
  return current.createdAt - previous.createdAt <= MESSAGE_GROUP_WINDOW_MS
}

export function isMessageVisible(
  message: ChatMessageDto,
  currentUserId: string,
  isHost: boolean,
): boolean {
  if (message.status === 'deleted') return false
  if (message.visibility === 'private') {
    return message.senderId === currentUserId || message.recipientId === currentUserId
  }
  if (message.status === 'hidden' && !isHost) return false
  return true
}
