import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from './database'
import { STORAGE_KEY } from '../utils/storage'
import { TeamSchema, PracticeSchema } from '@coaching-code/domain'
import type { HeatSafetyData } from '../types'
import type { DbTeam, DbPractice, SyncStatus } from './types'

// Migration runs once: if Dexie tables are empty and the legacy AsyncStorage
// blob exists, bulk-insert its contents into Dexie. Idempotent by design — once
// Dexie has rows, the migration is a no-op.
export const migrateFromAsyncStorage = async (): Promise<void> => {
  const teamCount = await db.teams.count()
  const practiceCount = await db.practices.count()
  if (teamCount > 0 || practiceCount > 0) {
    return
  }

  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return
  }

  let parsed: HeatSafetyData
  try {
    parsed = JSON.parse(stored) as HeatSafetyData
  } catch {
    return
  }

  const teams = parsed?.data?.teams
  const practices = parsed?.data?.practices
  if (!Array.isArray(teams) || !Array.isArray(practices)) {
    return
  }

  // Validate each legacy record before inserting so malformed or incomplete
  // rows never pollute the now-authoritative Dexie tables, and wrap the two
  // inserts in a transaction so a failure mid-migration leaves no partial state.
  const dbTeams: DbTeam[] = teams
    .filter(team => TeamSchema.safeParse(team).success)
    .map(team => ({
      ...team,
      _syncStatus: 'pending' as SyncStatus,
    }))
  const dbPractices: DbPractice[] = practices
    .filter(practice => PracticeSchema.safeParse(practice).success)
    .map(practice => ({
      ...practice,
      _syncStatus: 'pending' as SyncStatus,
    }))

  await db.transaction('rw', db.teams, db.practices, async () => {
    await db.teams.bulkPut(dbTeams)
    await db.practices.bulkPut(dbPractices)
  })

  // Preserve the migrated lastSync timestamp so a subsequent sync knows the
  // baseline. Stored as a lightweight marker under a distinct key.
  if (parsed.lastSync) {
    await AsyncStorage.setItem(`${STORAGE_KEY}.lastSync`, parsed.lastSync)
  }
}
