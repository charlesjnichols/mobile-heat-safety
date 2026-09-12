import { createSyncTriggerController } from '../../src/sync/trigger'
import type { DrainFn, SyncTriggerDeps } from '../../src/sync/trigger'

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

const flush = async (n = 200): Promise<void> => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve()
    await Promise.resolve()
  }
}

afterEach(() => {
  jest.useRealTimers()
})

describe('sync trigger controller', () => {
  it('performs a startup drain when online', () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true })
    const controller = createSyncTriggerController()

    controller.start(deps)

    return Promise.resolve().then(() => {
      expect(deps.drain).toHaveBeenCalledTimes(1)
      controller.stop()
    })
  })

  it('does not drain at startup while offline', () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: false })
    const controller = createSyncTriggerController()

    controller.start(deps)

    expect(deps.drain).not.toHaveBeenCalled()
    controller.stop()
  })

  it('starts the periodic timer at startup while online and ticks', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(1)

    controller.tickNow()
    await flush()

    expect(deps.drain).toHaveBeenCalledTimes(2)
    controller.stop()
  })

  it('fires an immediate drain on true connectivity restoration and starts the timer', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: false, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    expect(deps.drain).not.toHaveBeenCalled()

    controller.setConnectivity(true)
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(1)

    controller.tickNow()
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(2)

    controller.stop()
  })

  it('does NOT treat repeated/unchanged online connectivity as restoration (no flap trigger)', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(1)

    // Simulates a network-type swap / repeated online event.
    controller.setConnectivity(true)
    controller.setConnectivity(true)
    await flush()

    expect(deps.drain).toHaveBeenCalledTimes(1)
    controller.stop()
  })

  it('stops the timer and does not drain when connectivity is lost', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    controller.setConnectivity(false)
    await flush()

    controller.tickNow()
    await flush()

    expect(deps.drain).toHaveBeenCalledTimes(1)
    controller.stop()
  })

  it('skips ticks when no pending work exists', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => false) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    const baseline = deps.drainCalls()

    controller.tickNow()
    await flush()

    expect(deps.drainCalls()).toBe(baseline)
    controller.stop()
  })

  it('stops ticking while the app is inactive and resumes on active', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    controller.setActive(false)

    controller.tickNow()
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(1)

    controller.setActive(true)
    controller.tickNow()
    await flush()
    expect(deps.drain).toHaveBeenCalledTimes(2)

    controller.stop()
  })

  it('stop() is idempotent and clears timers', async () => {
    jest.useFakeTimers()
    const deps = makeDeps({ isOnline: true, hasPending: jest.fn(async () => true) })
    const controller = createSyncTriggerController()

    controller.start(deps)
    await flush()
    controller.stop()
    controller.stop()

    controller.tickNow()
    await flush()

    expect(deps.drain).toHaveBeenCalledTimes(1)
  })

  it('allows at most one drain per tick and relies solely on the engine guard for overlap', async () => {
    jest.useFakeTimers()
    let resolveDrain: (value: void) => void = () => undefined
    const drain: DrainFn = jest.fn(
      () => new Promise<void>(resolve => (resolveDrain = resolve))
    ) as unknown as DrainFn
    const deps = { drain, isOnline: true, hasPending: jest.fn(async () => true) }
    const controller = createSyncTriggerController()

    controller.start(deps)
    controller.tickNow()
    await flush()
    expect(drain).toHaveBeenCalledTimes(2) // tick fired; engine dedupes in flight

    resolveDrain()
    await flush()
    controller.stop()
  })
})
