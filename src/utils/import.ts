import { Team, Practice, HeatSafetyData } from '../types'
import { validateHeatSafetyData, TeamSchema, PracticeSchema } from './validation'

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  imported: boolean
  teamsImported: number
  practicesImported: number
  data: HeatSafetyData
}

/**
 * Normalize legacy data before validation:
 * - Drops the legacy `isActive` flag from practices.
 * - Folds a top-level `checklists` array into its parent practice by `practiceId`.
 */
export const normalizeLegacyData = (input: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...input }

  if (result.data && typeof result.data === 'object') {
    const data = { ...(result.data as Record<string, unknown>) }

    if (Array.isArray(data.practices)) {
      data.practices = (data.practices as Record<string, unknown>[]).map(practice => {
        const { isActive, ...rest } = practice
        void isActive
        // Default a missing `notes` field so legacy data imports cleanly.
        if (rest.notes === undefined) {
          rest.notes = ''
        }
        return rest
      })
    }

    // Fold top-level checklists into their parent practice.
    if (Array.isArray(data.checklists) && Array.isArray(data.practices)) {
      const orphaned = data.checklists as Record<string, unknown>[]
      data.practices = (data.practices as Record<string, unknown>[]).map(practice => {
        const existing = Array.isArray(practice.checklists)
          ? (practice.checklists as Record<string, unknown>[])
          : []
        const mine = orphaned.filter(
          c => c && (c as { practiceId?: string }).practiceId === practice.id
        )
        return { ...practice, checklists: [...existing, ...mine] }
      })
      delete data.checklists
    }

    result.data = data
  }

  return result
}

/**
 * Parse and validate a raw JSON string against the HeatSafetyData schema.
 * Throws a descriptive error if the payload is malformed or invalid.
 */
export const parseImportData = (jsonData: string): HeatSafetyData => {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonData)
  } catch {
    throw new Error('Import file is not valid JSON')
  }

  try {
    const normalized = normalizeLegacyData(parsed as Record<string, unknown>)
    return validateHeatSafetyData(normalized)
  } catch {
    throw new Error('Import data does not match the expected format')
  }
}

/**
 * Validate a single team object at runtime.
 */
export const validateImportedTeam = (team: unknown): Team => {
  return TeamSchema.parse(team)
}

/**
 * Validate a single practice object at runtime.
 */
export const validateImportedPractice = (practice: unknown): Practice => {
  return PracticeSchema.parse(practice)
}

/**
 * Import data from a raw JSON string, merging with or replacing existing data.
 *
 * This is a pure function: it performs no storage I/O and produces no side
 * effects. The caller is responsible for dispatching the resulting data through
 * the app state layer, whose auto-save effect persists it.
 *
 * - `replace` uses the imported data verbatim.
 * - `merge` deduplicates teams/practices by id, keeping existing records and
 *   adding only new ones.
 *
 * @param jsonData Raw JSON string to parse and validate.
 * @param mode 'merge' (default) or 'replace'.
 * @param existing The current dataset to merge against (ignored in replace mode).
 */
export const importData = (
  jsonData: string,
  mode: ImportMode = 'merge',
  existing: HeatSafetyData
): ImportResult => {
  const imported = parseImportData(jsonData)

  if (mode === 'replace') {
    return {
      imported: true,
      teamsImported: imported.data.teams.length,
      practicesImported: imported.data.practices.length,
      data: imported,
    }
  }

  const existingTeams = new Map(existing.data.teams.map(team => [team.id, team]))
  const existingPractices = new Map(
    existing.data.practices.map(practice => [practice.id, practice])
  )

  let teamsImported = 0
  imported.data.teams.forEach(team => {
    if (!existingTeams.has(team.id)) {
      existingTeams.set(team.id, team)
      teamsImported += 1
    }
  })

  let practicesImported = 0
  imported.data.practices.forEach(practice => {
    if (!existingPractices.has(practice.id)) {
      existingPractices.set(practice.id, practice)
      practicesImported += 1
    }
  })

  const result: HeatSafetyData = {
    version: existing.version,
    lastSync: existing.lastSync,
    data: {
      teams: Array.from(existingTeams.values()),
      practices: Array.from(existingPractices.values()),
    },
  }

  return {
    imported: true,
    teamsImported,
    practicesImported,
    data: result,
  }
}
