import { db } from '../../src/db/database'
import { enqueue, hasPendingWork } from '../../src/sync/queue'
import { createSyncTriggerController } from '../../src/sync/trigger'
import type { SyncTriggerDeps } from '../../src/sync/trigger'

// Integration tests: the controller driving the real Dexie-backed queue through
// the hasPendingWork gate, with the engine stubbed to avoid network I/O.
const flush = async (n = 200): Promise<void> => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve()
    await Promise.resolve()
  }
}

const seedTeam = async (id: string): Promise<void> => {
  await db.teams.put({
    id,
    name: `Team ${id}`,
    color: '#FF6B6B',
    createdAt: '2026-09-11T10:00:00Z',
    updatedAt: '2026-09-11T10:00:00Z',
    _syncStatus: 'pending',
  })
  await enqueue({ entityType: 'team', entityId: id, operation: 'create' })
}

beforeEach(async () => {
  await db.teams.clear()
  await db.practices.clear()
  await db.syncQueue.clear()
})

afterAll(async () => {
  await db.syncQueue.clear()
})

describe('sync trigger drain integration', () => {
  it('does not drain on a tick when the queue is empty, drains once work is enqueued (US1)', async () => {
    const drain = jest.fn(async () => ({ synced: 0, failed: 0, error: null }))
    const controller = createSyncTriggerController()
    controller.start({
      drain,
      isOnline: true,
      hasPending: hasPendingWork,
    } satisfies SyncTriggerDeps)
    await flush()

    const baseline = drain.mock.calls.length
    await seedTeam('team-1')

    await flush()
    expect(await hasPendingWork()).toBe(true)

    // Next while-online tick drains automatically — no connectivity event (FR-001).
    await controller.tickNow()
    expect(drain.mock.calls.length).toBe(baseline + 1)
    controller.stop()
  })

  it('retains a failed entry and retries on a later tick with no connectivity change (US3/FR-008)', async () => {
    let attempts = 0
    const drain = jest.fn(async () => {
      attempts += 1
      if (attempts === 1) {
        return { synced: 0, failed: 1, error: 'Network error' }
      }
      return { synced: 1, failed: 0, error: null }
    })
    const controller = createSyncTriggerController()
    controller.start({
      drain,
      isOnline: true,
      hasPending: hasPendingWork,
    } satisfies SyncTriggerDeps)
    await flush()

    await seedTeam('team-3')

    controller.tickNow()
    await flush()
    expect(drain).toHaveBeenCalledTimes(1)
    expect(await hasPendingWork()).toBe(true) // failure retains the entry

    controller.tickNow()
    await flush()
    expect(drain).toHaveBeenCalledTimes(2)

    controller.stop()
  })

  it('stops ticking entirely when connectivity is lost mid-session (FR-007 surface)', async () => {
    const drain = jest.fn(async () => ({ synced: 0, failed: 0, error: null }))
    const controller = createSyncTriggerController()
    controller.start({
      drain,
      isOnline: true,
      hasPending: hasPendingWork,
    } satisfies SyncTriggerDeps)
    await flush()
    const baseline = drain.mock.calls.length

    controller.setConnectivity(false)
    await flush()

    await seedTeam('team-4')

    // Tick evaluation while offline is a no-op: entries stay queued for
    // restoration (FR-002/FR-007).
    controller.tickNow()
    await flush()

    expect(drain.mock.calls.length).toBe(baseline)
    expect(await hasPendingWork()).toBe(true)

    controller.stop()
  })
})
