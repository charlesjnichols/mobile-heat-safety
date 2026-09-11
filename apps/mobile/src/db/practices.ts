import { db } from './database'
import type { DbPractice, SyncStatus } from './types'
import type { Practice } from '../types'

// Read all practices, optionally filtered by team, sorted by date (newest first).
export const getAllPractices = async (teamId?: string): Promise<DbPractice[]> => {
  let practices: DbPractice[]
  if (teamId) {
    practices = await db.practices.where('teamId').equals(teamId).toArray()
  } else {
    practices = await db.practices.toArray()
  }
  return [...practices].sort((a, b) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
    if (Number.isNaN(aTime)) return 1
    if (Number.isNaN(bTime)) return -1
    return bTime - aTime
  })
}

// Insert or update a practice (including its nested checklists), marking pending.
export const savePractice = async (practice: Practice): Promise<void> => {
  const existing = await db.practices.get(practice.id)
  const status: SyncStatus = existing ? existing._syncStatus : 'pending'
  await db.practices.put({ ...practice, _syncStatus: status })
}

// Delete a practice.
export const deletePractice = async (practiceId: string): Promise<void> => {
  await db.practices.delete(practiceId)
}

// Set the sync status of a practice.
export const setPracticeSyncStatus = async (
  practiceId: string,
  status: SyncStatus
): Promise<void> => {
  await db.practices.update(practiceId, { _syncStatus: status })
}
