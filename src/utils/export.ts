import { HeatSafetyData, Practice, Team, PracticeFilters } from '../types'
import { loadData } from './storage'

export interface ExportOptions {
  teamId?: string
  dateRange?: { start: string; end: string }
  searchQuery?: string
  includeSettings?: boolean
}

export interface ExportResult {
  exportedAt: string
  version: string
  data: {
    teams: Team[]
    practices: Practice[]
  }
}

const DEFAULT_VERSION = '1.0.0'

/**
 * Apply filters to a list of practices based on the provided options.
 * Filtering is pure and deterministic for offline consistency.
 */
export const filterPractices = (practices: Practice[], filters: PracticeFilters): Practice[] => {
  let result = [...practices]

  if (filters.teamId) {
    result = result.filter(practice => practice.teamId === filters.teamId)
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    const startTime = start ? Date.parse(start) : Number.NEGATIVE_INFINITY
    const endTime = end ? Date.parse(end) : Number.POSITIVE_INFINITY
    result = result.filter(practice => {
      const practiceTime = Date.parse(practice.date)
      return practiceTime >= startTime && practiceTime <= endTime
    })
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    const safeLower = (value: string | undefined) => (value ?? '').toLowerCase()
    result = result.filter(
      practice =>
        safeLower(practice.location).includes(query) ||
        safeLower(practice.headCoach ?? practice.coach).includes(query) ||
        safeLower(practice.name).includes(query)
    )
  }

  return result
}

/**
 * Generate a deterministic export filename with a timestamp.
 */
export const generateExportFilename = (now: Date = new Date()): string => {
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  return `heat-safety-data-${timestamp}.json`
}

/**
 * Build a complete export payload from full heat safety data,
 * optionally scoping the practices (and their teams) using filters.
 */
export const buildExportData = (
  data: HeatSafetyData,
  options: ExportOptions = {}
): ExportResult => {
  const filteredPractices = filterPractices(data.data.practices, {
    teamId: options.teamId,
    dateRange: options.dateRange,
    searchQuery: options.searchQuery,
  })

  const referencedTeamIds = new Set(filteredPractices.map(practice => practice.teamId))
  const teams = options.teamId
    ? data.data.teams.filter(team => team.id === options.teamId)
    : data.data.teams.filter(team => referencedTeamIds.has(team.id))

  return {
    exportedAt: new Date().toISOString(),
    version: data.version || DEFAULT_VERSION,
    data: {
      teams,
      practices: filteredPractices,
    },
  }
}

/**
 * Serialize the export payload to a pretty-printed JSON string.
 */
export const serializeExport = (data: ExportResult): string => {
  return JSON.stringify(data, null, 2)
}

/**
 * Export all persisted data (optionally filtered) as a JSON string.
 */
export const exportData = async (options: ExportOptions = {}): Promise<string> => {
  const data: HeatSafetyData = await loadData()
  const payload = buildExportData(data, options)
  return serializeExport(payload)
}
