import { db } from '../../src/db/database'
import { drain } from '../../src/sync/engine'
import { enqueue } from '../../src/sync/queue'
import { writeSession } from '../../src/auth/session'

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
})

afterAll(async () => {
  await db.syncQueue.clear()
})

describe('offline -> online auto-sync', () => {
  it('drains queued records once connectivity is restored', async () => {
    // Simulate offline recording: enqueue while offline.
    setAuth()
    await db.practices.put({
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
    await enqueue({ entityType: 'practice', entityId: 'practice-1', operation: 'create' })

    expect(await db.syncQueue.count()).toBe(1)

    // Connectivity returns: drain fires.
    mockFetch.mockResolvedValue({ status: 200, json: async () => ({}) })
    const result = await drain()

    expect(result.synced).toBe(1)
    expect(await db.syncQueue.count()).toBe(0)
    const practice = await db.practices.get('practice-1')
    expect(practice?._syncStatus).toBe('synced')
  })
})
