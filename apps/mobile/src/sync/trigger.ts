
import type { DrainResult } from './engine'
import { BACKOFF_MS as RETRY_BACKOFF_MS } from './queue'

// Interval between while-online drain ticks. Mirrors the failed-entry retry
// backoff in queue.ts so an entry that just failed a drain attempt is naturally
// eligible again by the next tick — no scheduler-level retry math needed.
export const SYNC_TICK_INTERVAL_MS = RETRY_BACKOFF_MS

// Reactive drain handle. Single-flight overlap protection lives exclusively in
// drain() (engine.ts); the controller deliberately keeps no lock of its own.
export type DrainFn = () => Promise<DrainResult>

export interface SyncTriggerDeps {
  drain: DrainFn
  isOnline: boolean
  hasPending: () => Promise<boolean>
}

export interface SyncTriggerController {
  start(deps: SyncTriggerDeps): void
  setConnectivity(isOnline: boolean): void
  setActive(active: boolean): void
  stop(): void
  /**
   * Forces one periodic-tick evaluation. Production uses the interval; tests
   * may call it directly to sidestep fake-timer microtask scheduling quirks.
   */
  tickNow(): Promise<void>
}

interface TriggerState {
  deps: SyncTriggerDeps | null
  online: boolean
  active: boolean
  timer: ReturnType<typeof setInterval> | null
}

// A connectivity call only counts as "restoration" — and may fire an immediate
// drain — when the previous hint was actually false. A repeated/unchanged
// true value (the flap case) triggers nothing.
const startTimer = (state: TriggerState): void => {
  if (state.timer !== null || !state.online || !state.active) {
    return
  }
  state.timer = setInterval(() => {
    void tick(state)
  }, SYNC_TICK_INTERVAL_MS)
}

const stopTimer = (state: TriggerState): void => {
  if (state.timer !== null) {
    clearInterval(state.timer)
    state.timer = null
  }
}

const drainNow = async (state: TriggerState): Promise<void> => {
  const { deps } = state
  if (!deps) {
    return
  }
  try {
    await deps.drain()
  } catch (error) {
    console.error('Sync drain failed:', error)
  }
}

// A tick is a redundant drain when offline-eligible work is absent. The engine's
// own internal queue-emptiness fast path also guards this, but checking here
// avoids even entering drain() for the common idle case.
const tick = async (state: TriggerState): Promise<void> => {
  const { deps } = state
  if (!deps || !state.online || !state.active) {
    return
  }
  let pending: boolean
  try {
    pending = await deps.hasPending()
  } catch (error) {
    console.error('Sync pending check failed:', error)
    return
  }
  if (!pending) {
    return
  }
  await drainNow(state)
}

// Owns WHEN drain() runs: app startup while online, connectivity restoration,
// and a periodic while-online cycle. Owns no HTTP, storage, or retry logic —
// those remain in sync/engine.ts and sync/queue.ts.
export const createSyncTriggerController = (): SyncTriggerController => {
  const state: TriggerState = {
    deps: null,
    online: false,
    active: true,
    timer: null,
  }

  return {
    start(deps) {
      stopTimer(state)
      state.deps = deps
      state.online = deps.isOnline
      state.active = true
      startTimer(state)
      if (state.online) {
        // Startup drain: guarantee the launch-with-pending-data path instead of
        // relying on the initial useNetworkStatus render.
        void drainNow(state)
      }
    },

    setConnectivity(isOnline) {
      if (state.online && !isOnline) {
        state.online = false
        stopTimer(state)
        return
      }
      // Guard the flap case: true when already true triggers nothing.
      if (!state.online && isOnline) {
        state.online = true
        startTimer(state)
        void drainNow(state)
      }
    },

    setActive(active) {
      if (state.active === active) {
        return
      }
      state.active = active
      if (active) {
        startTimer(state)
      } else {
        stopTimer(state)
      }
    },

    stop() {
      state.deps = null
      state.online = false
      stopTimer(state)
    },

    tickNow() {
      return tick(state)
    },
  }
}

export const syncTriggerController = createSyncTriggerController()
export default createSyncTriggerController
