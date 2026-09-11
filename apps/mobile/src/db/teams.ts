import { db } from './database'
import type { DbTeam, SyncStatus } from './types'
import type { Team } from '../types'

// Read all teams from the Dexie source of truth.
export const getAllTeams = async (): Promise<DbTeam[]> => {
  return db.teams.toArray()
}

// Insert or update a team, marking it pending for sync.
export const saveTeam = async (team: Team): Promise<void> => {
  const existing = await db.teams.get(team.id)
  const status: SyncStatus = existing ? existing._syncStatus : 'pending'
  await db.teams.put({ ...team, _syncStatus: status })
}

// Delete a team and its practices by teamId.
export const deleteTeam = async (teamId: string): Promise<void> => {
  await db.transaction('rw', db.teams, db.practices, async () => {
    await db.practices.where('teamId').equals(teamId).delete()
    await db.teams.delete(teamId)
  })
}

// Set the sync status of a team.
export const setTeamSyncStatus = async (
  teamId: string,
  status: SyncStatus
): Promise<void> => {
  await db.teams.update(teamId, { _syncStatus: status })
}
