import Dexie, { type Table } from 'dexie'
import type { DbTeam, DbPractice, SyncQueueEntry } from './types'

// Local IndexedDB database. This is the authoritative source of truth for all
// field actions (constitution II); any backend is a replication target.
// synchronized asynchronously.
export class HeatSafetyDatabase extends Dexie {
  teams!: Table<DbTeam, string>
  practices!: Table<DbPractice, string>
  syncQueue!: Table<SyncQueueEntry, number>

  constructor() {
    super('heat-safety-db')

    this.version(1).stores({
      teams: 'id, _syncStatus',
      practices: 'id, teamId, date, _syncStatus',
      syncQueue: '++id, entityId',
    })
  }
}

// Singleton database instance shared across the app.
export const db = new HeatSafetyDatabase()
