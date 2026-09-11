import { db } from '../../src/db/database'
import { savePractice, deletePractice, getAllPractices } from '../../src/db/practices'
import type { Practice } from '../../src/types'

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

describe('practice CRUD against Dexie', () => {
  beforeEach(async () => {
    await db.practices.clear()
    await db.teams.clear()
  })

  afterAll(async () => {
    await db.practices.clear()
  })

  it('saves a practice with nested checklists and marks it pending', async () => {
    const practice = makePractice({
      checklists: [
        {
          id: 'checklist-1',
          practiceId: 'practice-1',
          time: '14:00',
          temperature: 85,
          humidity: 70,
          heatIndex: 95,
          actionTaken: 'Water breaks every 20 minutes',
          timestamp: '2026-09-01T14:00:00Z',
          deviceInfo: 'iPhone 12',
        },
      ],
    })

    await savePractice(practice)

    const stored = await db.practices.get('practice-1')
    expect(stored?.checklists).toHaveLength(1)
    expect(stored?._syncStatus).toBe('pending')
  })

  it('updates an existing practice preserving its sync status', async () => {
    await savePractice(makePractice())
    await db.practices.update('practice-1', { _syncStatus: 'synced' })

    await savePractice(makePractice({ name: 'Updated Name' }))

    const stored = await db.practices.get('practice-1')
    expect(stored?.name).toBe('Updated Name')
    expect(stored?._syncStatus).toBe('synced')
  })

  it('deletes a practice', async () => {
    await savePractice(makePractice())

    await deletePractice('practice-1')

    expect(await db.practices.get('practice-1')).toBeUndefined()
  })

  it('reads practices filtered by team and sorted by date', async () => {
    await savePractice(makePractice({ id: 'p1', date: '2026-09-01', teamId: 'team-1' }))
    await savePractice(makePractice({ id: 'p2', date: '2026-09-03', teamId: 'team-1' }))
    await savePractice(makePractice({ id: 'p3', date: '2026-09-02', teamId: 'team-2' }))

    const team1 = await getAllPractices('team-1')
    expect(team1.map(p => p.id)).toEqual(['p2', 'p1'])

    const all = await getAllPractices()
    expect(all).toHaveLength(3)
  })
})
