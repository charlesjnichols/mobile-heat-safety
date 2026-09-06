import {
  filterPractices,
  generateExportFilename,
  buildExportData,
  serializeExport,
} from '../../src/utils/export'
import { HeatSafetyData, Practice, Team } from '../../src/types'

const makePractice = (overrides: Partial<Practice> = {}): Practice => ({
  id: 'p1',
  name: 'Morning Practice',
  date: '2026-09-02',
  location: 'Field A',
  coach: 'John Coach',
  headCoach: 'John Coach',
  sport: 'Soccer',
  contactInfo: 'coach@example.com',
  teamId: 'team-1',
  checklists: [],
  createdAt: '2026-09-02T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  ...overrides,
})

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Team A',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
})

const buildFixture = (): HeatSafetyData => ({
  version: '1.0.0',
  lastSync: null,
  data: {
    teams: [makeTeam(), makeTeam({ id: 'team-2', name: 'Team B' })],
    practices: [
      makePractice(),
      makePractice({
        id: 'p2',
        name: 'Afternoon Practice',
        location: 'Field B',
        teamId: 'team-2',
        date: '2026-09-03',
      }),
    ],
  },
})

describe('Export utilities', () => {
  describe('filterPractices', () => {
    const fixture = buildFixture()

    it('returns all practices when no filters are provided', () => {
      expect(filterPractices(fixture.data.practices, {})).toHaveLength(2)
    })

    it('filters practices by team id', () => {
      const result = filterPractices(fixture.data.practices, {
        teamId: 'team-2',
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('p2')
    })

    it('filters practices by date range', () => {
      const result = filterPractices(fixture.data.practices, {
        dateRange: { start: '2026-09-01', end: '2026-09-02' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('p1')
    })

    it('filters practices by search query', () => {
      const result = filterPractices(fixture.data.practices, {
        searchQuery: 'field b',
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('p2')
    })

    it('does not mutate the original practices array', () => {
      const practices = fixture.data.practices
      filterPractices(practices, { teamId: 'team-2' })
      expect(practices).toHaveLength(2)
    })
  })

  describe('generateExportFilename', () => {
    it('starts with the expected prefix', () => {
      const filename = generateExportFilename(new Date('2026-09-02T10:00:00.000Z'))
      expect(filename.startsWith('heat-safety-data-')).toBe(true)
    })

    it('ends with the .json extension', () => {
      const filename = generateExportFilename()
      expect(filename.endsWith('.json')).toBe(true)
    })

    it('is deterministic for a fixed timestamp', () => {
      const d = new Date('2026-09-02T10:00:00.000Z')
      expect(generateExportFilename(d)).toBe(generateExportFilename(d))
    })
  })

  describe('buildExportData', () => {
    it('includes all data when no options are provided', () => {
      const result = buildExportData(buildFixture())
      expect(result.data.teams).toHaveLength(2)
      expect(result.data.practices).toHaveLength(2)
    })

    it('scopes practices and teams when filtering by team', () => {
      const result = buildExportData(buildFixture(), { teamId: 'team-2' })
      expect(result.data.teams).toHaveLength(1)
      expect(result.data.teams[0].id).toBe('team-2')
      expect(result.data.practices).toHaveLength(1)
      expect(result.data.practices[0].teamId).toBe('team-2')
    })

    it('includes only referenced teams when filtering by date', () => {
      const result = buildExportData(buildFixture(), {
        dateRange: { start: '2026-09-03', end: '2026-09-03' },
      })
      expect(result.data.practices).toHaveLength(1)
      expect(result.data.teams.map(t => t.id)).toEqual(['team-2'])
    })
  })

  describe('serializeExport', () => {
    it('round-trips through JSON.parse', () => {
      const payload = buildExportData(buildFixture())
      const json = serializeExport(payload)
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.data.practices).toHaveLength(2)
    })

    it('is pretty printed with two-space indentation', () => {
      const json = serializeExport(buildExportData(buildFixture()))
      expect(json).toContain('\n  ')
    })
  })
})
