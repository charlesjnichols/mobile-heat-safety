import { Practice } from '../types'

/**
 * Generate a collision-resistant unique id. Prefers `crypto.randomUUID()` when
 * available (RN/Expo web), falling back to a timestamp + random-suffix combo so
 * ids remain unique even when generated within the same millisecond.
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Generate a reasonably unique team id based on the current timestamp.
 */
export const generateTeamId = (): string => {
  return `team-${generateId()}`
}

/**
 * Determine whether a team name is available (not already used, ignoring the
 * team being edited). Comparison is case-insensitive and trims whitespace.
 */
export const isTeamNameAvailable = (
  name: string,
  existingNames: string[],
  currentName?: string
): boolean => {
  const trimmed = name.trim().toLowerCase()
  if (!trimmed) return false

  const currentTrimmed = (currentName ?? '').trim().toLowerCase()

  return !existingNames.some(
    existing =>
      existing.trim().toLowerCase() === trimmed && existing.trim().toLowerCase() !== currentTrimmed
  )
}

/**
 * Whether a team can be deleted: it must not have any associated practices.
 */
export const canDeleteTeam = (teamId: string, practices: Practice[]): boolean => {
  return !practices.some(practice => practice.teamId === teamId)
}

/**
 * Number of practices associated with a team.
 */
export const countTeamPractices = (teamId: string, practices: Practice[]): number => {
  return practices.filter(practice => practice.teamId === teamId).length
}
