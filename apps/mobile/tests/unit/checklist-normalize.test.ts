import { normalizeLegacyData } from '../../src/utils/import'

describe('normalizeLegacyData', () => {
  it('drops the legacy isActive flag from practices', () => {
    const input = {
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [],
        practices: [
          {
            id: 'p1',
            name: 'Morning Practice',
            date: '2026-09-02',
            location: 'Field A',
            coach: 'John Coach',
            sport: 'Soccer',
            contactInfo: 'coach@example.com',
            teamId: 'team-1',
            isActive: true,
            checklists: [],
            createdAt: '2026-09-02T10:00:00Z',
            updatedAt: '2026-09-02T10:00:00Z',
          },
        ],
      },
    }

    const result = normalizeLegacyData(input)
    const practice = (result.data as { practices: Record<string, unknown>[] }).practices[0]
    expect(practice.isActive).toBeUndefined()
  })

  it('folds a top-level checklists array into its parent practice', () => {
    const input = {
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [],
        practices: [
          {
            id: 'p1',
            name: 'Morning Practice',
            date: '2026-09-02',
            location: 'Field A',
            coach: 'John Coach',
            sport: 'Soccer',
            contactInfo: 'coach@example.com',
            teamId: 'team-1',
            checklists: [],
            createdAt: '2026-09-02T10:00:00Z',
            updatedAt: '2026-09-02T10:00:00Z',
          },
        ],
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
      },
    }

    const result = normalizeLegacyData(input)
    const data = result.data as {
      practices: { id: string; checklists: unknown[] }[]
      checklists?: unknown
    }
    expect(data.practices[0].checklists).toHaveLength(1)
    expect(data.checklists).toBeUndefined()
  })

  it('leaves already-normalized data unchanged in structure', () => {
    const input = {
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [],
        practices: [],
      },
    }
    const result = normalizeLegacyData(input)
    expect(result.data).toBeDefined()
    expect((result.data as { checklists?: unknown }).checklists).toBeUndefined()
  })
})
