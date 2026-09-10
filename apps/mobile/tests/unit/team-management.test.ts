import {
  generateTeamId,
  isTeamNameAvailable,
  canDeleteTeam,
  countTeamPractices,
} from '../../src/utils/teamManagement'
import { Practice } from '../../src/types'

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
  notes: '',
  checklists: [],
  createdAt: '2026-09-02T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  ...overrides,
})

describe('Team management utilities', () => {
  describe('generateTeamId', () => {
    it('prefixes with "team-"', () => {
      expect(generateTeamId()).toMatch(/^team-.+/)
    })

    it('is unique even when called within the same millisecond', () => {
      const first = generateTeamId()
      const second = generateTeamId()
      expect(first).not.toBe(second)
    })
  })

  describe('isTeamNameAvailable', () => {
    const existing = ['Varsity Team', 'JV Team']

    it('returns true for a new unique name', () => {
      expect(isTeamNameAvailable('Freshman Team', existing)).toBe(true)
    })

    it('returns false for a duplicate name (case-insensitive)', () => {
      expect(isTeamNameAvailable('varsity team', existing)).toBe(false)
    })

    it('returns true when editing a team and keeping its own name', () => {
      expect(isTeamNameAvailable('Varsity Team', existing, 'Varsity Team')).toBe(true)
    })

    it('returns false for an empty name', () => {
      expect(isTeamNameAvailable('   ', existing)).toBe(false)
    })
  })

  describe('canDeleteTeam', () => {
    it('returns true when the team has no practices', () => {
      expect(canDeleteTeam('team-2', [makePractice()])).toBe(true)
    })

    it('returns false when the team has associated practices', () => {
      expect(canDeleteTeam('team-1', [makePractice()])).toBe(false)
    })
  })

  describe('countTeamPractices', () => {
    it('counts practices for a team', () => {
      const practices = [
        makePractice(),
        makePractice({ id: 'p2', teamId: 'team-2' }),
        makePractice({ id: 'p3', teamId: 'team-2' }),
      ]
      expect(countTeamPractices('team-2', practices)).toBe(2)
      expect(countTeamPractices('team-1', practices)).toBe(1)
    })
  })
})
