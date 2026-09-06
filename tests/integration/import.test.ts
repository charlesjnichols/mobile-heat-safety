import {
  parseImportData,
  validateImportedTeam,
  validateImportedPractice,
  importData,
} from '../../src/utils/import'
import { HeatSafetyData } from '../../src/types'

const validData: HeatSafetyData = {
  version: '1.0.0',
  lastSync: null,
  data: {
    teams: [
      {
        id: 'team-1',
        name: 'Team A',
        color: '#FF6B6B',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ],
    practices: [
      {
        id: 'p1',
        name: 'Morning Practice',
        date: '2026-09-02',
        location: 'Field A',
        coach: 'John Coach',
        headCoach: 'John Coach',
        sport: 'Soccer',
        contactInfo: 'coach@example.com',
        teamId: 'team-1',
        checklists: [
          {
            id: 'c1',
            practiceId: 'p1',
            time: '14:00',
            temperature: 85,
            humidity: 70,
            heatIndex: 95,
            actionTaken: 'Water breaks every 20 minutes',
            timestamp: '2026-09-02T14:00:00Z',
            deviceInfo: 'iPhone 12',
          },
        ],
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T14:00:00Z',
      },
    ],
  },
}

describe('Import utilities', () => {
  describe('parseImportData', () => {
    it('parses valid JSON data', () => {
      const result = parseImportData(JSON.stringify(validData))
      expect(result.data.teams).toHaveLength(1)
      expect(result.data.practices).toHaveLength(1)
    })

    it('throws for malformed JSON', () => {
      expect(() => parseImportData('{not json')).toThrow('Import file is not valid JSON')
    })

    it('throws for JSON that does not match the schema', () => {
      expect(() => parseImportData(JSON.stringify({ foo: 'bar' }))).toThrow(
        'Import data does not match the expected format'
      )
    })
  })

  describe('validateImportedTeam', () => {
    it('returns the team when valid', () => {
      const team = validData.data.teams[0]
      expect(validateImportedTeam(team).id).toBe('team-1')
    })

    it('throws for an invalid team', () => {
      expect(() => validateImportedTeam({ id: 'team-1' })).toThrow()
    })
  })

  describe('validateImportedPractice', () => {
    it('returns the practice when valid', () => {
      const practice = validData.data.practices[0]
      expect(validateImportedPractice(practice).id).toBe('p1')
    })

    it('throws for an invalid practice', () => {
      expect(() => validateImportedPractice({ id: 'p1', name: 'X' })).toThrow()
    })
  })

  describe('importData', () => {
    it('imports data using replace mode and returns the replacement dataset', () => {
      const result = importData(JSON.stringify(validData), 'replace', validData)
      expect(result.imported).toBe(true)
      expect(result.teamsImported).toBe(1)
      expect(result.practicesImported).toBe(1)
      expect(result.data.data.teams).toHaveLength(1)
      expect(result.data.data.practices).toHaveLength(1)
    })

    it('merges data against existing without duplicating existing records', () => {
      const duplicateImport = JSON.stringify({
        ...validData,
        data: {
          teams: [...validData.data.teams],
          practices: [
            ...validData.data.practices,
            {
              ...validData.data.practices[0],
              id: 'p2',
              name: 'Second Practice',
              location: 'Field B',
            },
          ],
        },
      })

      const result = importData(duplicateImport, 'merge', validData)
      expect(result.teamsImported).toBe(0)
      expect(result.practicesImported).toBe(1)
      // Existing record kept, only the new practice added.
      expect(result.data.data.practices).toHaveLength(2)
      expect(result.data.data.teams).toHaveLength(1)
    })
  })
})
