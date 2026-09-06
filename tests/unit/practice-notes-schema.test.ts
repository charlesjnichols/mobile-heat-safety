import { PracticeSchema } from '../../src/utils/validation'

describe('PracticeSchema.notes', () => {
  const basePractice = {
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
  }

  it('accepts a practice with a valid notes string', () => {
    const result = PracticeSchema.safeParse({ ...basePractice, notes: 'Player showed heat symptoms' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('Player showed heat symptoms')
    }
  })

  it('defaults missing notes to an empty string', () => {
    const result = PracticeSchema.safeParse(basePractice)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
    }
  })

  it('defaults an empty notes to an empty string', () => {
    const result = PracticeSchema.safeParse({ ...basePractice, notes: '' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
    }
  })

  it('rejects notes longer than 2000 characters', () => {
    const result = PracticeSchema.safeParse({ ...basePractice, notes: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts notes exactly 2000 characters', () => {
    const result = PracticeSchema.safeParse({ ...basePractice, notes: 'x'.repeat(2000) })
    expect(result.success).toBe(true)
  })

  it('rejects non-string notes', () => {
    const result = PracticeSchema.safeParse({ ...basePractice, notes: 123 })
    expect(result.success).toBe(false)
  })
})