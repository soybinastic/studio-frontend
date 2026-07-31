export interface TileOrderConfig {
  version: number
  assignments: Record<string, string>
}

export interface SceneSourcesConfig {
  version: number
  sources: unknown[]
  assignments?: Record<string, string>
}

export function resolveEffectiveAssignments(
  sessionConfig: TileOrderConfig | undefined,
  sceneSources: SceneSourcesConfig | undefined,
): Record<string, string> | null {
  const scene = sceneSources?.assignments
  if (scene && Object.keys(scene).length > 0) return scene

  const session = sessionConfig?.assignments
  if (session && Object.keys(session).length > 0) return session

  return null
}

export function defaultSourceOrder(
  sourceIds: string[],
  hostPeerId: string | null,
  hostOwnedSourceIds: Set<string>,
): string[] {
  const ordered: string[] = []
  const used = new Set<string>()

  if (hostPeerId && sourceIds.includes(hostPeerId)) {
    ordered.push(hostPeerId)
    used.add(hostPeerId)
  }

  for (const sourceId of sourceIds) {
    if (hostOwnedSourceIds.has(sourceId) && !used.has(sourceId)) {
      ordered.push(sourceId)
      used.add(sourceId)
    }
  }

  for (const sourceId of sourceIds) {
    if (!used.has(sourceId)) {
      ordered.push(sourceId)
      used.add(sourceId)
    }
  }

  return ordered
}

function applySlotAssignments(
  visibleIds: string[],
  assignments: Record<string, string>,
  defaultOrder: string[],
): string[] {
  const visibleSet = new Set(visibleIds)
  const used = new Set<string>()
  const slotNumbers = Object.keys(assignments)
    .map((key) => Number.parseInt(key, 10))
    .filter((slot) => !Number.isNaN(slot) && slot >= 0)

  if (slotNumbers.length === 0) return defaultOrder

  const maxSlot = Math.max(...slotNumbers)
  const slots: Array<string | null> = Array.from({ length: maxSlot + 1 }, () => null)

  for (const slot of slotNumbers.sort((a, b) => a - b)) {
    const sourceId = assignments[String(slot)]
    if (!sourceId || !visibleSet.has(sourceId) || used.has(sourceId)) continue
    slots[slot] = sourceId
    used.add(sourceId)
  }

  const unassigned = defaultOrder.filter((sourceId) => !used.has(sourceId))
  let fillCursor = 0
  for (let index = 0; index < slots.length; index += 1) {
    if (slots[index] === null && fillCursor < unassigned.length) {
      slots[index] = unassigned[fillCursor]
      used.add(unassigned[fillCursor])
      fillCursor += 1
    }
  }

  const ordered = slots.filter((sourceId): sourceId is string => sourceId !== null)
  for (const sourceId of unassigned.slice(fillCursor)) {
    if (!used.has(sourceId)) {
      ordered.push(sourceId)
      used.add(sourceId)
    }
  }

  return ordered
}

export function resolveSourceOrder(
  activeSourceIds: string[],
  options: {
    hostPeerId: string | null
    slotAssignments: Record<string, string> | null
    hiddenSourceIds: Set<string>
    hostOwnedSourceIds: Set<string>
  },
): string[] {
  const visibleIds = activeSourceIds.filter((id) => !options.hiddenSourceIds.has(id))
  const defaultOrder = defaultSourceOrder(
    visibleIds,
    options.hostPeerId,
    options.hostOwnedSourceIds,
  )

  if (options.slotAssignments && Object.keys(options.slotAssignments).length > 0) {
    return applySlotAssignments(visibleIds, options.slotAssignments, defaultOrder)
  }

  return defaultOrder
}

export function assignmentsFromOrder(sourceIds: string[]): Record<string, string> {
  const assignments: Record<string, string> = {}
  sourceIds.forEach((sourceId, index) => {
    assignments[String(index)] = sourceId
  })
  return assignments
}

export function reorderSourceIds(sourceIds: string[], fromIndex: number, toIndex: number): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sourceIds.length ||
    toIndex >= sourceIds.length
  ) {
    return sourceIds
  }

  const next = [...sourceIds]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
