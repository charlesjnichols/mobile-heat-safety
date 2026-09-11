import type { DbTeam, DbPractice, SyncQueueEntry, SyncStatus } from '../../src/db/types'

const makeTeam = (): DbTeam => ({
  id: 'team-1',
  name: 'Team A',
  color: '#FF6B6B',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  _syncStatus: 'pending',
})

const makePractice = (): DbPractice => ({
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
  _syncStatus: 'pending',
})

describe('DB types', () => {
  it('DbTeam extends Team with a sync status', () => {
    const team = makeTeam()
    expect(team._syncStatus).toBe('pending')
    expect(team.id).toBe('team-1')
    expect(team.name).toBe('Team A')
  })

  it('DbPractice extends Practice with a sync status', () => {
    const practice = makePractice()
    expect(practice._syncStatus).toBe('pending')
    expect(practice.checklists).toEqual([])
  })

  it('SyncQueueEntry captures retry metadata', () => {
    const entry: SyncQueueEntry = {
      entityType: 'team',
      entityId: 'team-1',
      operation: 'create',
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      createdAt: '2026-09-01T10:00:00Z',
    }
    expect(entry.attempts).toBe(0)
  })

  it('SyncStatus is a closed union', () => {
    const statuses: SyncStatus[] = ['pending', 'synced', 'failed']
    expect(statuses).toHaveLength(3)
  })
})
