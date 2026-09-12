import { db } from '../../src/db/database'
import { enqueue, hasPendingWork } from '../../src/sync/queue'
import { createSyncTriggerController } from '../../src/sync/trigger'
import type { SyncTriggerDeps } from '../../src/sync/trigger'

// Integration: a network-type swap that stays online must never trigger a
// drain by itself (the reported defect: "drain only triggers on flap").
const flush = async (n = 200): Promise<void> => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve()
    await Promise.resolve()
  }
}

beforeEach(async () => {
  await db.teams.clear()
  await db.practices.clear()
  await db.syncQueue.clear()
})

afterAll(async () => {
  await db.syncQueue.clear()
})

describe('no drain on connectivity swap/flap (US1 regression)', () => {
  it('fires no drain when connectivity stays true across repeated hints', async () => {
    const drain = jest.fn(async () => ({ synced: 0, failed: 0, error: null }))
    const controller = createSyncTriggerController()
    controller.start({
      drain,
      isOnline: true,
      hasPending: hasPendingWork,
    } satisfies SyncTriggerDeps)
    await flush()
    const baseline = drain.mock.calls.length

    // Network-type swap reported as repeated "online" events.
    controller.setConnectivity(true)
    controller.setConnectivity(true)
    await flush()

    expect(drain.mock.calls.length).toBe(baseline)
    controller.stop()
  })

  it('still drains immediately on a real offline→online restoration (US2/SC-003)', async () => {
    const drain = jest.fn(async () => ({ synced: 1, failed: 0, error: null }))
    const controller = createSyncTriggerController()
    controller.start({
      drain,
      isOnline: false,
      hasPending: hasPendingWork,
    } satisfies SyncTriggerDeps)
    await flush()
    expect(drain).not.toHaveBeenCalled()

    // Connectivity restored while the app stays open: immediate drain (FR-002).
    controller.setConnectivity(true)
    await flush()

    expect(drain).toHaveBeenCalledTimes(1)
    controller.stop()
  })

  it('stops the timer on connectivity loss so no drain runs while offline', async () => {
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

    await db.teams.put({
      id: 'team-off',
      name: 'Team Offline',
      color: '#FF6B6B',
      createdAt: '2026-09-11T10:00:00Z',
      updatedAt: '2026-09-11T10:00:00Z',
      _syncStatus: 'pending',
    })
    await enqueue({ entityType: 'team', entityId: 'team-off', operation: 'create' })

    // Offline: no drain attempt; work is retained locally (FR-007).
    await controller.tickNow()
    expect(drain.mock.calls.length).toBe(baseline)
    expect(await hasPendingWork()).toBe(true)

    // Connectivity returns: immediate automatic drain, no user action (FR-002).
    controller.setConnectivity(true)
    await flush()
    expect(drain.mock.calls.length).toBe(baseline + 1)

    controller.stop()
  })
})
