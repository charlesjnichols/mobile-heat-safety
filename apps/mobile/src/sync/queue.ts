import { db } from '../db/database'
import type { SyncQueueEntry } from '../db/types'

export type SyncOperation = 'create' | 'update' | 'delete'
export type SyncEntityType = 'team' | 'practice'

export interface EnqueueParams {
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperation
}

// Upper bound on failed attempts before an entry is dropped from the queue. The
// underlying data is never lost — Dexie remains the source of truth and a later
// mutation of the same record re-enqueues it — so giving up on a persistently
// failing entry prevents the queue from retrying a poisoned mutation forever.
export const MAX_ATTEMPTS = 5

// Minimum delay before an entry that failed is eligible for another retry.
export const BACKOFF_MS = 60_000

// Enqueue a mutation for later upload. If an entry for the same entity already
// exists, coalesce by updating its operation (last-write-wins) rather than
// creating a duplicate — preserving FIFO ordering while avoiding unbounded queue
// growth. The query + write run inside a single read-write transaction so two
// concurrent enqueues of the same entity cannot both observe "no existing
// entry" and insert duplicate rows.
export const enqueue = async (params: EnqueueParams): Promise<void> => {
  await db.transaction('rw', db.syncQueue, async () => {
    const existing = await db.syncQueue
      .where('entityId')
      .equals(params.entityId)
      .first()

    const now = new Date().toISOString()
    if (existing) {
      await db.syncQueue.update(existing.id as number, {
        operation: params.operation,
        attempts: 0,
        lastError: null,
        createdAt: now,
      })
      return
    }

    await db.syncQueue.add({
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      createdAt: now,
    })
  })
}

// List pending entries in FIFO (creation) order.
export const listPending = async (): Promise<SyncQueueEntry[]> => {
  return db.syncQueue.orderBy('id').toArray()
}

// True if a failed entry is eligible for retry: it has not exhausted its attempt
// budget and its backoff window has elapsed.
export const isEligible = (
  entry: SyncQueueEntry,
  now: number = Date.now()
): boolean => {
  if (entry.attempts >= MAX_ATTEMPTS) {
    return false
  }
  if (!entry.lastAttemptAt) {
    return true
  }
  return now - new Date(entry.lastAttemptAt).getTime() >= BACKOFF_MS
}

// Drop entries that have exhausted their retry budget. They are recoverable from
// Dexie on the next mutation, so removing them just stops the infinite retry loop.
export const purgeExhausted = async (): Promise<number> => {
  const entries = await db.syncQueue.toArray()
  const done = entries.filter(
    entry => entry.attempts >= MAX_ATTEMPTS
  )
  await Promise.all(done.map(entry => db.syncQueue.delete(entry.id as number)))
  return done.length
}

// Mark an entry as successfully synced and remove it from the queue.
export const markSynced = async (id: number): Promise<void> => {
  await db.syncQueue.delete(id)
}

// Record a failed attempt (increment attempts, capture the error).
export const markFailed = async (
  id: number,
  error: string
): Promise<void> => {
  const entry = await db.syncQueue.get(id)
  await db.syncQueue.update(id, {
    attempts: (entry?.attempts ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: error,
  })
}

// Count of entries currently awaiting upload.
export const pendingCount = async (): Promise<number> => {
  return db.syncQueue.count()
}

// Cheap tick-gate for the sync trigger controller: true when any queue work
// exists, without fetching full entries.
export const hasPendingWork = async (): Promise<boolean> => {
  return (await db.syncQueue.count()) > 0
}
