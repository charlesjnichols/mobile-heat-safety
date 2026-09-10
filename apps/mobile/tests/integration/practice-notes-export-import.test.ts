import { buildExportData, serializeExport } from '../../src/utils/export'
import { parseImportData } from '../../src/utils/import'
import { PracticeSchema } from '../../src/utils/validation'

const makePractice = (overrides: Record<string, unknown> = {}) => ({
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

const makeTeam = () => ({
  id: 'team-1',
  name: 'Team A',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
})

describe('Notes persistence across export/import', () => {
  it('includes notes in serialized export output', () => {
    const data = {
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [makeTeam()],
        practices: [makePractice({ notes: 'Player showed heat symptoms' })],
      },
    } as any

    const payload = buildExportData(data)
    const json = serializeExport(payload)
    expect(json).toContain('Player showed heat symptoms')
  })

  it('round-trips notes through parseImportData', () => {
    const practiceWithNotes = makePractice({ notes: 'Keep this note' })
    const valid = PracticeSchema.parse(practiceWithNotes)

    const input = JSON.stringify({
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [makeTeam()],
        practices: [valid],
      },
    })

    const result = parseImportData(input)
    expect(result.data.practices[0].notes).toBe('Keep this note')
  })

  it('defaults missing notes to empty string on legacy import', () => {
    const input = JSON.stringify({
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: [makeTeam()],
        practices: [makePractice()],
      },
    })

    const result = parseImportData(input)
    expect(result.data.practices[0].notes).toBe('')
  })
})