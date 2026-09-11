import { db } from '../../src/db/database'
import {
  enqueue,
  listPending,
  markSynced,
  markFailed,
  pendingCount,
} from '../../src/sync/queue'

describe('sync queue', () => {
  beforeEach(async () => {
    await db.syncQueue.clear()
    await db.teams.clear()
    await db.practices.clear()
  })

  afterAll(async () => {
    await db.syncQueue.clear()
  })

  it('enqueues a mutation in FIFO order', async () => {
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })
    await enqueue({ entityType: 'practice', entityId: 'practice-1', operation: 'update' })

    const entries = await listPending()
    expect(entries).toHaveLength(2)
    expect(entries[0].entityId).toBe('team-1')
    expect(entries[1].entityId).toBe('practice-1')
    expect(entries[0].attempts).toBe(0)
  })

  it('coalesces duplicate entries for the same entity', async () => {
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'update' })

    const entries = await listPending()
    expect(entries).toHaveLength(1)
    expect(entries[0].operation).toBe('update')
  })

  it('marks an entry synced by removing it from the queue', async () => {
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })
    const [entry] = await listPending()

    await markSynced(entry.id as number)

    expect(await pendingCount()).toBe(0)
  })

  it('marks an entry failed with an incremented attempt count', async () => {
    await enqueue({ entityType: 'team', entityId: 'team-1', operation: 'create' })
    const [entry] = await listPending()

    await markFailed(entry.id as number, 'Validation failed')
    await markFailed(entry.id as number, 'Validation failed')

    const updated = await db.syncQueue.get(entry.id as number)
    expect(updated?.attempts).toBe(2)
    expect(updated?.lastError).toBe('Validation failed')
    expect(updated?.lastAttemptAt).toBeTruthy()
  })
})
