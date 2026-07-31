/**
 * Returns true for internal mediasoup peers that should not appear in the studio UI.
 * The compositor joins as a BroadcasterPeer with id `compositor-{sessionId}`.
 */
export function isCompositorPeer(
  peerId: string,
  options?: { roomId?: string; displayName?: string },
): boolean {
  if (options?.displayName === 'Compositor') return true
  if (peerId.startsWith('compositor-')) return true
  if (options?.roomId && peerId === `compositor-${options.roomId}`) return true
  return false
}

export function filterStudioPeers<T extends { peerId: string; displayName?: string }>(
  peers: T[],
  roomId?: string,
): T[] {
  return peers.filter((p) => !isCompositorPeer(p.peerId, { roomId, displayName: p.displayName }))
}
