import { db } from '../db/database'
import { listPending, markFailed, markSynced, isEligible, purgeExhausted } from './queue'
import type { SyncQueueEntry } from '../db/types'
import type { HeatSafetyData } from '../types'
import { cognitoConfig } from '../auth/config'
import { readLastAuthUser, readSession, isSessionExpired } from '../auth/session'
import type { SyncState } from './types'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LAST_SYNC_KEY = 'heatSafetyData.lastSync'

// Guards against overlapping drain() runs (e.g. rapid online/offline toggles),
// preventing duplicate snapshot uploads and queue races.
let draining = false

// Read the last successful sync timestamp (persisted marker).
const readLastSync = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

// Build the full HeatSafetyData snapshot from the Dexie source of truth.
export const buildHeatSafetyData = async (): Promise<HeatSafetyData> => {
  const teams = await db.teams.toArray()
  const practices = await db.practices.toArray()
  const lastSync = await readLastSync()
  return {
    version: '1.0.0',
    lastSync,
    data: {
      // Strip the internal _syncStatus field before sending to the backend.
      teams: teams.map(({ _syncStatus, ...team }) => team),
      practices: practices.map(({ _syncStatus, ...practice }) => practice),
    },
  }
}

export interface DrainResult {
  synced: number
  failed: number
  error: string | null
}

// Resolve the current bearer token from the cached Cognito session. Returns null
// when the session is absent or its idToken has already expired (an expired token
// would only 401 server-side, so we surface it as "not authenticated" instead).
const resolveToken = (): string | null => {
  const username = readLastAuthUser()
  if (!username) {
    return null
  }
  const session = readSession(username)
  if (!session) {
    return null
  }
  if (isSessionExpired(session)) {
    return null
  }
  return session.idToken
}

// Drain the sync queue: upload pending records to the backend in FIFO order.
export const drain = async (): Promise<DrainResult> => {
  if (draining) {
    return { synced: 0, failed: 0, error: null }
  }
  draining = true
  try {
    const entries = await listPending()
    const now = Date.now()
    const eligible = entries.filter(entry => isEligible(entry, now))
    // Drop entries that exhausted their retry budget (data still lives in Dexie).
    await purgeExhausted()

    if (eligible.length === 0) {
      return { synced: 0, failed: 0, error: null }
    }

    const token = resolveToken()
    if (!token) {
      return { synced: 0, failed: eligible.length, error: 'Not authenticated' }
    }

    let synced = 0
    let failed = 0
    let lastError: string | null = null
    let data: HeatSafetyData
    try {
      // Reads moved inside a try so a Dexie failure is reported through the
      // result instead of being swallowed by the caller.
      data = await buildHeatSafetyData()
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Database error'
      return { synced: 0, failed: eligible.length, error: lastError }
    }

    try {
      const response = await fetch(`${cognitoConfig.apiUrl}/sync`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data, lastSync: data.lastSync }),
      })

      if (response.status === 200) {
        for (const entry of eligible) {
          await markSynced(entry.id as number)
          synced += 1
        }
        await markAllSynced(
          data.data.teams.map(t => t.id),
          data.data.practices.map(p => p.id)
        )
        await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
      } else if (response.status === 401) {
        lastError = 'Unauthorized'
        failed = eligible.length
      } else if (response.status === 400) {
        for (const entry of eligible) {
          await markFailed(entry.id as number, 'Validation failed')
          failed += 1
        }
      } else {
        lastError = `Sync failed (${response.status})`
        failed = eligible.length
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'
      failed = eligible.length
    }

    return { synced, failed, error: lastError }
  } finally {
    draining = false
  }
}

// After a successful whole-document PUT, mark only the records that were actually
// included in the uploaded snapshot as synced. Restricting to those ids avoids
// flipping records to 'synced' that were mutated (and re-enqueued) while the PUT
// was in flight but never reached the backend.
const markAllSynced = async (
  teamIds: string[],
  practiceIds: string[]
): Promise<void> => {
  await db.transaction('rw', db.teams, db.practices, async () => {
    for (const id of teamIds) {
      const team = await db.teams.get(id)
      if (team) {
        await db.teams.put({ ...team, _syncStatus: 'synced' })
      }
    }
    for (const id of practiceIds) {
      const practice = await db.practices.get(id)
      if (practice) {
        await db.practices.put({ ...practice, _syncStatus: 'synced' })
      }
    }
  })
}

// Read the current sync state for UI display.
export const getSyncState = async (): Promise<SyncState> => {
  const pending = await db.syncQueue.count()
  const lastSyncAt = await readLastSync()
  return {
    syncing: false,
    pendingCount: pending,
    lastSyncAt,
    lastError: null,
  }
}

// Re-export for the engine integration tests.
export type { SyncQueueEntry }
