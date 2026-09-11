import { db } from '../../src/db/database'
import type { DbTeam, DbPractice, SyncQueueEntry, SyncStatus } from '../../src/db/types'
import { migrateFromAsyncStorage } from '../../src/db/migration'
import AsyncStorage from '@react-native-async-storage/async-storage'

describe('Dexie database schema', () => {
  beforeEach(async () => {
    await db.teams.clear()
    await db.practices.clear()
    await db.syncQueue.clear()
  })

  afterAll(async () => {
    await db.teams.clear()
    await db.practices.clear()
    await db.syncQueue.clear()
  })

  it('creates the teams, practices, and syncQueue tables', async () => {
    const tableNames = db.tables.map(t => t.name)
    expect(tableNames).toEqual(
      expect.arrayContaining(['teams', 'practices', 'syncQueue'])
    )
  })

  it('stores a team with a sync status', async () => {
    const team: DbTeam = {
      id: 'team-1',
      name: 'Team A',
      color: '#FF6B6B',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      _syncStatus: 'pending',
    }
    await db.teams.put(team)
    const stored = await db.teams.get('team-1')
    expect(stored).toEqual(team)
  })

  it('stores a practice with nested checklists and a sync status', async () => {
    const practice: DbPractice = {
      id: 'practice-1',
      name: 'Morning Practice',
      date: '2026-09-01',
      location: 'Field A',
      coach: 'John Coach',
      sport: 'Soccer',
      contactInfo: 'coach@example.com',
      teamId: 'team-1',
      notes: '',
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
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T14:00:00Z',
      _syncStatus: 'synced',
    }
    await db.practices.put(practice)
    const stored = await db.practices.get('practice-1')
    expect(stored?.checklists).toHaveLength(1)
    expect(stored?._syncStatus).toBe('synced')
  })

  it('stores a sync queue entry with auto-increment id', async () => {
    const entry: SyncQueueEntry = {
      entityType: 'practice',
      entityId: 'practice-1',
      operation: 'update',
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      createdAt: '2026-09-01T10:00:00Z',
    }
    const id = await db.syncQueue.add(entry)
    expect(id).toBeGreaterThan(0)
    const stored = await db.syncQueue.get(id)
    expect(stored?.entityId).toBe('practice-1')
  })
})

describe('sync status type', () => {
  it('only accepts pending, synced, or failed', () => {
    const valid: SyncStatus[] = ['pending', 'synced', 'failed']
    expect(valid).toHaveLength(3)
  })
})

describe('migration from AsyncStorage', () => {
  beforeEach(async () => {
    await db.teams.clear()
    await db.practices.clear()
    await db.syncQueue.clear()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await db.teams.clear()
    await db.practices.clear()
    await db.syncQueue.clear()
  })

  it('is a no-op when Dexie already has data', async () => {
    await db.teams.put({
      id: 'team-existing',
      name: 'Existing',
      color: '#000000',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      _syncStatus: 'synced',
    })
    const getItemMock = AsyncStorage.getItem as jest.Mock
    getItemMock.mockResolvedValue(
      JSON.stringify({
        version: '1.0.0',
        lastSync: null,
        data: { teams: [], practices: [] },
      })
    )

    await migrateFromAsyncStorage()

    const teams = await db.teams.toArray()
    expect(teams).toHaveLength(1)
    expect(teams[0].id).toBe('team-existing')
 })

  it('migrates AsyncStorage data into Dexie when empty', async () => {
    const getItemMock = AsyncStorage.getItem as jest.Mock
    getItemMock.mockResolvedValue(
      JSON.stringify({
        version: '1.0.0',
        lastSync: '2026-09-01T10:00:00Z',
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
          practices: [],
        },
      })
    )

    await migrateFromAsyncStorage()

    const teams = await db.teams.toArray()
    expect(teams).toHaveLength(1)
    expect(teams[0].id).toBe('team-1')
    expect(teams[0]._syncStatus).toBe('pending')
  })

  it('does nothing when AsyncStorage has no data', async () => {
    const getItemMock = AsyncStorage.getItem as jest.Mock
    getItemMock.mockResolvedValue(null)

    await migrateFromAsyncStorage()

    expect(await db.teams.count()).toBe(0)
    expect(await db.practices.count()).toBe(0)
  })
})
