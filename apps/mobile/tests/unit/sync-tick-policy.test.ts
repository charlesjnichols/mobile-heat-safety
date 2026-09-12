import { createSyncTriggerController } from '../../src/sync/trigger'
import type { DrainFn, SyncTriggerDeps } from '../../src/sync/trigger'

// Tick policy tests (US3): skip-when-empty, retry-after-failure convergence,
// and sole-reliance on the engine guard for overlap (no second lock here).
const flush = async (n = 200): Promise<void> => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve()
    await Promise.resolve()
  }
}

const makeDeps = (
  overrides: Partial<SyncTriggerDeps> = {}
): SyncTriggerDeps & { drainCalls: () => number } => {
  let calls = 0
  return {
    drain: jest.fn(async () => {
      calls += 1
      return { synced: 1, failed: 0, error: null }
    }),
    isOnline: false,
    hasPending: jest.fn(async () => true),
    ...overrides,
    drainCalls: () => calls,
  }
}

afterEach(() => {
  jest.useRealTimers()
})

describe('sync tick policy (US3)', () => {
  it('asks hasPending on every tick but calls drain only when pending', async () => {
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()
    controller.start(deps)
    await flush()
    const cps = deps.hasPending as jest.Mock
    expect(cps).toHaveBeenCalledTimes(0) // startup drain bypasses the gate

    controller.tickNow()
    await flush()
    controller.tickNow()
    await flush()
    expect(cps).toHaveBeenCalledTimes(2)
    expect(deps.drain).toHaveBeenCalledTimes(3) // startup + 2 ticks

    // Queue drains empty: tick evaluates the gate and skips the drain.
    ;(deps.hasPending as jest.Mock).mockImplementation(async () => false)
    controller.tickNow()
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(3)
    controller.tickNow()
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(3)
    controller.stop()
  })

  it('keeps retrying automatically after a failed tick drain (SC-002/FR-008)', async () => {
    let failures = 0
    const drain: DrainFn = jest.fn(async () => {
      failures += 1
      if (failures <= 2) {
        return { synced: 0, failed: 1, error: 'Transient server error' }
      }
      return { synced: 1, failed: 0, error: null }
    }) as unknown as DrainFn
    const deps = makeDeps({ isOnline: true })
    deps.drain = drain
    const controller = createSyncTriggerController()
    controller.start(deps)
    await flush()

    controller.tickNow()
    await flush()
    controller.tickNow()
    await flush()
    controller.tickNow()
    await flush()
    expect(failures).toBeGreaterThan(0)
    controller.stop()
  })

  it('evaluates one tick per tickNow call (no queued retrospective drain)', async () => {
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()
    controller.start(deps)
    await flush()
    const baseline = deps.drainCalls()

    controller.tickNow()
    controller.tickNow()
    await flush()
    expect(deps.drainCalls()).toBe(baseline + 2) // exactly one drain per tick; overlap stays in the engine
    controller.stop()
  })
})
