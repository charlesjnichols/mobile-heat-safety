import { appReducer } from '../../src/context/AppContext'
import { HeatSafetyData, Team, Practice } from '../../src/types'

interface AppState {
  data: HeatSafetyData
  loading: boolean
  error: string | null
}

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Team A',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
})

const makePractice = (overrides: Partial<Practice> = {}): Practice => ({
  id: 'p1',
  name: 'Morning Practice',
  date: '2026-09-01',
  location: 'Field A',
  coach: 'John Coach',
  headCoach: 'John Coach',
  sport: 'Soccer',
  contactInfo: 'coach@example.com',
  teamId: 'team-1',
  notes: '',
  checklists: [],
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
})

const makeState = (overrides: Partial<HeatSafetyData> = {}): AppState => ({
  data: {
    version: '1.0.0',
    lastSync: null,
    data: { teams: [], practices: [] },
    ...overrides,
  },
  loading: false,
  error: null,
})

describe('appReducer new persistence actions', () => {
  describe('REPLACE_DATA', () => {
    it('replaces the entire dataset', () => {
      const incoming: HeatSafetyData = {
        version: '1.0.0',
        lastSync: null,
        data: {
          teams: [makeTeam({ id: 'x', name: 'New Team' })],
          practices: [makePractice({ id: 'y' })],
        },
      }
      const state = makeState({
        data: {
          teams: [makeTeam()],
          practices: [makePractice()],
        },
      })

      const next = appReducer(state as never, {
        type: 'REPLACE_DATA',
        payload: incoming,
      }) as AppState

      expect(next.data.data.teams).toHaveLength(1)
      expect(next.data.data.teams[0].id).toBe('x')
      expect(next.data.data.practices).toHaveLength(1)
      expect(next.data.data.practices[0].id).toBe('y')
    })

    it('does not alter loading/error', () => {
      const state = { ...makeState(), loading: true, error: 'oops' }
      const next = appReducer(state as never, {
        type: 'REPLACE_DATA',
        payload: makeState().data,
      }) as AppState

      expect(next.loading).toBe(true)
      expect(next.error).toBe('oops')
    })
  })

  describe('MERGE_DATA', () => {
    it('appends only records whose ids are not already present', () => {
      const state = makeState({
        data: {
          teams: [makeTeam({ id: 'existing-team' })],
          practices: [makePractice({ id: 'existing-practice' })],
        },
      })

      const next = appReducer(state as never, {
        type: 'MERGE_DATA',
        payload: {
          teams: [
            makeTeam({ id: 'existing-team', name: 'Overwrite Attempt' }),
            makeTeam({ id: 'new-team' }),
          ],
          practices: [
            makePractice({ id: 'existing-practice', location: 'Changed' }),
            makePractice({ id: 'new-practice' }),
          ],
        },
      }) as AppState

      // Existing records win on id conflict.
      expect(next.data.data.teams).toHaveLength(2)
      expect(next.data.data.teams.find(t => t.id === 'existing-team')!.name).toBe('Team A')
      expect(next.data.data.teams.some(t => t.id === 'new-team')).toBe(true)

      expect(next.data.data.practices).toHaveLength(2)
      expect(
        next.data.data.practices.find(p => p.id === 'existing-practice')!.location
      ).toBe('Field A')
      expect(next.data.data.practices.some(p => p.id === 'new-practice')).toBe(true)
    })
  })

  describe('CLEAR_DATA', () => {
    it('resets data to default empty shape', () => {
      const state = makeState({
        data: {
          teams: [makeTeam()],
          practices: [makePractice()],
        },
      })

      const next = appReducer(state as never, { type: 'CLEAR_DATA' }) as AppState

      expect(next.data.data.teams).toEqual([])
      expect(next.data.data.practices).toEqual([])
      expect(next.data.version).toBe('1.0.0')
    })
  })
})