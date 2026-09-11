import type { SyncStatus } from '../db/types'

// Sync state exposed to the UI. `pendingCount` reflects the number of local
// records awaiting upload; `syncing` indicates an in-flight drain.
export interface SyncState {
  syncing: boolean
  pendingCount: number
  lastSyncAt: string | null
  lastError: string | null
}

export type { SyncStatus }
