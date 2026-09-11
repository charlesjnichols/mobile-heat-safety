import { db } from '../../src/db/database'
import { saveTeam, deleteTeam, getAllTeams } from '../../src/db/teams'
import { savePractice } from '../../src/db/practices'
import type { Team, Practice } from '../../src/types'

const makeTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  name: 'Team A',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
})

const makePractice = (overrides: Partial<Practice> = {}): Practice => ({
  id: 'practice-1',
  name: 'Morning Practice',
  date: '2026-09-01',
  location: 'Field A',
  coach: 'John Coach',
  sport: 'Soccer',
  contactInfo: 'coach@example.com',
  teamId: 'team-1',
  notes: '',
  checklists: [],
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  ...overrides,
})

describe('team CRUD against Dexie', () => {
  beforeEach(async () => {
    await db.teams.clear()
    await db.practices.clear()
  })

  afterAll(async () => {
    await db.teams.clear()
    await db.practices.clear()
  })

  it('saves a team and marks it pending', async () => {
    await saveTeam(makeTeam())

    const stored = await db.teams.get('team-1')
    expect(stored?.name).toBe('Team A')
    expect(stored?._syncStatus).toBe('pending')
  })

  it('updates a team preserving its sync status', async () => {
    await saveTeam(makeTeam())
    await db.teams.update('team-1', { _syncStatus: 'synced' })

    await saveTeam(makeTeam({ name: 'Team B' }))

    const stored = await db.teams.get('team-1')
    expect(stored?.name).toBe('Team B')
    expect(stored?._syncStatus).toBe('synced')
  })

  it('deletes a team and its practices', async () => {
    await saveTeam(makeTeam())
    await savePractice(makePractice())

    await deleteTeam('team-1')

    expect(await db.teams.get('team-1')).toBeUndefined()
    expect(await db.practices.get('practice-1')).toBeUndefined()
  })

  it('reads all teams', async () => {
    await saveTeam(makeTeam())
    await saveTeam(makeTeam({ id: 'team-2', name: 'Team B' }))

    const teams = await getAllTeams()
    expect(teams).toHaveLength(2)
  })
})
