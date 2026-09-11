import { db } from '../../src/db/database'
import { buildHeatSafetyData, drain } from '../../src/sync/engine'
import { enqueue } from '../../src/sync/queue'
import { writeSession } from '../../src/auth/session'
import AsyncStorage from '@react-native-async-storage/async-storage'

const mockFetch = jest.fn()

const setAuth = () => {
  const session = {
    getIdToken: () => ({ getJwtToken: () => 'jwt-token', getExpiration: () => Math.floor(Date.now() / 1000) + 3600 }),
    getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
    getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
  } as unknown as Parameters<typeof writeSession>[1]
  writeSession('coach@example.com', session)
}

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch
})

beforeEach(async () => {
  await db.teams.clear()
  await db.practices.clear()
  await db.syncQueue.clear()
  jest.clearAllMocks()
  sessionStorage.clear()
  await AsyncStorage.removeItem('heatSafetyData.lastSync')
})

afterAll(async () => {
  await db.syncQueue.clear()
})

describe('sync engine', () => {
  it('builds HeatSafetyData from Dexie, stripping sync status', async () => {
    await db.teams.put({
      id: 'team-1',
      name: 'Team A',
      color: '#FF6B6B',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      _syncStatus: 'pending',
    })

    const data = await buildHeatSafetyData()
    expect(data.data.teams).toHaveLength(1)
    expect(data.data.teams[0]).not.toHaveProperty('_syncStatus')
    expect(data.data.teams[0].id).toBe('team-1')
  })

  it('drains the queue with a successful PUT and marks records synced', async () => {
    setAuth()
    await db.teams.put({
      id: 'team-1',
      name: 'Team A',
      color: '#FF6B6B',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
      _syncStatus: 'pending',
    })
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })

    mockFetch.mockResolvedValue({
      status: 200,
      json: async () => ({}),
    })

    const result = await drain()

    expect(result.synced).toBe(1)
    expect(result.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/sync'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      })
    )
    const team = await db.teams.get('team-1')
    expect(team?._syncStatus).toBe('synced')
    expect(await db.syncQueue.count()).toBe(0)
  })

  it('returns not authenticated when no token is cached', async () => {
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })

    const result = await drain()

    expect(result.error).toBe('Not authenticated')
    expect(result.synced).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('keeps the queue on network error for retry', async () => {
    setAuth()
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })

    mockFetch.mockRejectedValue(new Error('Network request failed'))

    const result = await drain()

    expect(result.failed).toBe(1)
    expect(result.error).toBe('Network request failed')
    expect(await db.syncQueue.count()).toBe(1)
  })

  it('offline-deferred sync leaves local records readable and writable', async () => {
    setAuth()
    const now = '2026-09-11T10:00:00Z'
    await db.teams.put({
      id: 'team-2',
      name: 'Team Two',
      color: '#4ECDC4',
      createdAt: now,
      updatedAt: now,
      _syncStatus: 'pending',
    })
    await enqueue({ entityType: 'team', entityId: 'team-2', operation: 'create' })
    mockFetch.mockRejectedValue(new Error('Network request failed'))

    await drain()

    // Field actions remain unblocked: the local record is still present and
    // mutable even though sync failed (offline-first guarantee).
    const team = await db.teams.get('team-2')
    expect(team).not.toBeNull()
    await db.teams.put({
      ...team,
      name: 'Team Two (edited offline)',
      updatedAt: '2026-09-11T11:00:00Z',
    } as never)
    const edited = await db.teams.get('team-2')
    expect(edited?.name).toBe('Team Two (edited offline)')
  })
})
