import type { Team, Practice } from '../types'

// Sync tracking field shared by all persisted entities.
export type SyncStatus = 'pending' | 'synced' | 'failed'

// Dexie-persisted Team: the domain Team plus the local sync-tracking field.
export type DbTeam = Team & { _syncStatus: SyncStatus }

// Dexie-persisted Practice: the domain Practice plus the local sync-tracking field.
export type DbPractice = Practice & { _syncStatus: SyncStatus }

// Row shape for the internal sync queue table.
export interface SyncQueueEntry {
  id?: number
  entityType: 'team' | 'practice'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  attempts: number
  lastAttemptAt: string | null
  lastError: string | null
  createdAt: string
}
