import { normalizeLegacyData } from '../../src/utils/import'

describe('normalizeLegacyData - notes', () => {
  const makePractice = (extra: Record<string, unknown> = {}) => ({
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
    ...extra,
  })

  it('defaults a missing notes field to an empty string', () => {
    const input = {
      version: '1.0.0',
      lastSync: null,
      data: { teams: [], practices: [makePractice()] },
    }
    const result = normalizeLegacyData(input)
    const practice = (result.data as { practices: Record<string, unknown>[] }).practices[0]
    expect(practice.notes).toBe('')
  })

  it('preserves an existing notes field', () => {
    const input = {
      version: '1.0.0',
      lastSync: null,
      data: { teams: [], practices: [makePractice({ notes: 'Keep this note' })] },
    }
    const result = normalizeLegacyData(input)
    const practice = (result.data as { practices: Record<string, unknown>[] }).practices[0]
    expect(practice.notes).toBe('Keep this note')
  })
})