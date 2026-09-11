import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { getDefaultData } from '../utils/storage'
import { Team, Practice, Checklist, HeatSafetyData } from '../types'
import { db } from '../db/database'
import { migrateFromAsyncStorage } from '../db/migration'
import { enqueue } from '../sync/queue'

const SAVE_ERROR_MESSAGE = 'Failed to save data'

// Initial mock data for development
const initialTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team A',
    color: '#FF6B6B',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Team B',
    color: '#4ECDC4',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
]

const initialPractices: Practice[] = [
  {
    id: 'practice-1',
    name: 'Morning Practice',
    date: '2026-09-01',
    location: 'Field A',
    coach: 'John Coach',
    sport: 'Soccer',
    contactInfo: 'john@example.com',
    headCoach: 'John Coach',
    teamId: 'team-1',
    notes: '',
    checklists: [
      {
        id: 'checklist-1',
        practiceId: 'practice-1',
        time: '14:00',
        temperature: 85,
        humidity: 70,
        heatIndex: 95,
        actionTaken: 'Water breaks every 20 minutes',
        timestamp: '2026-09-01T14:00:00Z',
        deviceInfo: 'iPhone 12',
      },
    ],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T14:00:00Z',
  },
  {
    id: 'practice-2',
    name: 'Afternoon Practice',
    date: '2026-09-02',
    location: 'Field B',
    coach: 'Jane Coach',
    sport: 'Football',
    contactInfo: 'jane@example.com',
    headCoach: 'Jane Coach',
    teamId: 'team-2',
    notes: '',
    checklists: [
      {
        id: 'checklist-2',
        practiceId: 'practice-2',
        time: '15:00',
        temperature: 75,
        humidity: 60,
        heatIndex: 80,
        actionTaken: 'No restrictions',
        timestamp: '2026-09-02T15:00:00Z',
        deviceInfo: 'iPhone 12',
      },
    ],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T15:00:00Z',
  },
]

// Action types
type AppAction =
  | { type: 'SET_DATA'; payload: HeatSafetyData }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'ADD_PRACTICE'; payload: Practice }
  | { type: 'UPDATE_PRACTICE'; payload: Practice }
  | { type: 'DELETE_PRACTICE'; payload: string }
  | { type: 'ADD_CHECKLIST'; payload: { practiceId: string; checklist: Checklist } }
  | { type: 'UPDATE_CHECKLIST'; payload: { practiceId: string; checklist: Checklist } }
  | { type: 'DELETE_CHECKLIST'; payload: { practiceId: string; checklistId: string } }
  | { type: 'REPLACE_DATA'; payload: HeatSafetyData }
  | { type: 'MERGE_DATA'; payload: { teams: Team[]; practices: Practice[] } }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_HYDRATED' }

// State interface
interface AppState {
  data: {
    version: string
    lastSync: string | null
    data: {
      teams: Team[]
      practices: Practice[]
    }
  }
  loading: boolean
  error: string | null
  // True only after the initial AsyncStorage load resolves. Gates the save effect
  // so persisted user data is never overwritten by the seeded default state.
  hydrated: boolean
}

// Initial state
const initialState: AppState = {
  data: {
    version: '1.0.0',
    lastSync: null,
    data: {
      teams: initialTeams,
      practices: initialPractices,
    },
  },
  loading: false,
  error: null,
  hydrated: false,
}

// Reducer
export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
      }
    case 'ADD_TEAM':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            teams: [...state.data.data.teams, action.payload],
          },
        },
      }
    case 'UPDATE_TEAM':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            teams: state.data.data.teams.map(team =>
              team.id === action.payload.id ? action.payload : team
            ),
          },
        },
      }
    case 'DELETE_TEAM':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            teams: state.data.data.teams.filter(team => team.id !== action.payload),
          },
        },
      }
    case 'ADD_PRACTICE':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: [...state.data.data.practices, action.payload],
          },
        },
      }
    case 'UPDATE_PRACTICE':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: state.data.data.practices.map(practice =>
              practice.id === action.payload.id ? action.payload : practice
            ),
          },
        },
      }
    case 'DELETE_PRACTICE':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: state.data.data.practices.filter(practice => practice.id !== action.payload),
          },
        },
      }
    case 'ADD_CHECKLIST':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: state.data.data.practices.map(practice =>
              practice.id === action.payload.practiceId
                ? {
                    ...practice,
                    checklists: [...practice.checklists, action.payload.checklist],
                    updatedAt: new Date().toISOString(),
                  }
                : practice
            ),
          },
        },
      }
    case 'UPDATE_CHECKLIST':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: state.data.data.practices.map(practice =>
              practice.id === action.payload.practiceId
                ? {
                    ...practice,
                    checklists: practice.checklists.map(checklist =>
                      checklist.id === action.payload.checklist.id
                        ? action.payload.checklist
                        : checklist
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : practice
            ),
          },
        },
      }
    case 'DELETE_CHECKLIST':
      return {
        ...state,
        data: {
          ...state.data,
          lastSync: new Date().toISOString(),
          data: {
            ...state.data.data,
            practices: state.data.data.practices.map(practice =>
              practice.id === action.payload.practiceId
                ? {
                    ...practice,
                    checklists: practice.checklists.filter(
                      checklist => checklist.id !== action.payload.checklistId
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : practice
            ),
          },
        },
      }
    case 'REPLACE_DATA':
      return {
        ...state,
        data: action.payload,
      }
    case 'MERGE_DATA': {
      // Resolve conflicts by id, keeping the newest record (by updatedAt).
      const teams = mergeById(state.data.data.teams, action.payload.teams)
      const practices = mergeById(state.data.data.practices, action.payload.practices)
      return {
        ...state,
        data: {
          ...state.data,
          data: { teams, practices },
        },
      }
    }
    case 'CLEAR_DATA':
      return {
        ...state,
        data: getDefaultData(),
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    case 'SET_HYDRATED':
      return {
        ...state,
        hydrated: true,
        loading: false,
      }
    default:
      return state
  }
}

// Merge two arrays of records by id, taking the record with the newest updatedAt.
function mergeById<T extends { id: string; updatedAt?: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of [...existing, ...incoming]) {
    const current = map.get(item.id)
    if (!current || (item.updatedAt ?? '') > (current.updatedAt ?? '')) {
      map.set(item.id, item)
    }
  }
  return Array.from(map.values())
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider component
interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load data from Dexie on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        // One-time migration from legacy AsyncStorage into Dexie.
        await migrateFromAsyncStorage()

        const teams = await db.teams.toArray()
        const practices = await db.practices.toArray()

        dispatch({
          type: 'SET_DATA',
          payload: {
            version: '1.0.0',
            lastSync: null,
            data: {
              teams: teams.map(stripSyncStatus),
              practices: practices.map(stripSyncStatus),
            },
          },
        })

        // Mark hydrated only after the initial load resolves; this gates the save
        // effect below so the seed/default state is never written over persisted data.
        dispatch({ type: 'SET_HYDRATED' })
      } catch (error) {
        console.error('Error loading data:', error)
        // Keep hydrated=false so we never overwrite good stored data with the fallback.
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' })
      }
    }

    loadData()
  }, [])

  // Persist mutations to Dexie (source of truth) and enqueue sync events.
  useEffect(() => {
    const persist = async () => {
      try {
        await persistStateToDexie(state.data)
        if (state.error === SAVE_ERROR_MESSAGE) {
          dispatch({ type: 'SET_ERROR', payload: null })
        }
      } catch (error) {
        console.error('Error saving data:', error)
        dispatch({ type: 'SET_ERROR', payload: SAVE_ERROR_MESSAGE })
      }
    }

    // Only persist once the initial load has resolved. A previous LOAD error must
    // not be overwritten by the seeded fallback state.
    if (state.hydrated && state.error !== 'Failed to load data') {
      persist()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data, state.hydrated])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

// Strip the internal _syncStatus field before it reaches the in-memory state.
const stripSyncStatus = <T extends { _syncStatus?: unknown }>(record: T) => {
  const { _syncStatus, ...rest } = record
  void _syncStatus
  return rest
}

// Persist the full in-memory dataset to Dexie, marking changed records pending
// and enqueueing them for background sync. Idempotent whole-dataset sync keeps
// the implementation simple and correct for the single-device model.
const persistStateToDexie = async (data: HeatSafetyData): Promise<void> => {
  await db.transaction('rw', db.teams, db.practices, db.syncQueue, async () => {
    // Snapshot reads live inside the transaction so they observe a single
    // consistent view (not stale rows committed by a concurrent sync write).
    const existingTeams = new Map((await db.teams.toArray()).map(t => [t.id, t]))
    const existingPractices = new Map(
      (await db.practices.toArray()).map(p => [p.id, p])
    )

    const teamIds = new Set<string>()
    for (const team of data.data.teams) {
      const prev = existingTeams.get(team.id)
      const changed = !prev || prev.updatedAt !== team.updatedAt
      const status = changed ? 'pending' : (prev?._syncStatus ?? 'pending')
      await db.teams.put({ ...team, _syncStatus: status })
      // Enqueue when the record changed OR it is still awaiting first upload
      // (e.g. rows migrated from AsyncStorage are 'pending' but were never
      // enqueued), so pending data is always uploaded rather than stuck forever.
      if (changed || status === 'pending') {
        teamIds.add(team.id)
      }
    }
    // Remove teams no longer present.
    const currentTeamIds = new Set(data.data.teams.map(t => t.id))
    for (const existing of existingTeams.values()) {
      if (!currentTeamIds.has(existing.id)) {
        await db.teams.delete(existing.id)
      }
    }

    const practiceIds = new Set<string>()
    for (const practice of data.data.practices) {
      const prev = existingPractices.get(practice.id)
      const changed = !prev || prev.updatedAt !== practice.updatedAt
      const status = changed ? 'pending' : (prev?._syncStatus ?? 'pending')
      await db.practices.put({ ...practice, _syncStatus: status })
      if (changed || status === 'pending') {
        practiceIds.add(practice.id)
      }
    }
    const currentPracticeIds = new Set(data.data.practices.map(p => p.id))
    for (const existing of existingPractices.values()) {
      if (!currentPracticeIds.has(existing.id)) {
        await db.practices.delete(existing.id)
      }
    }

    // Enqueue changed records for background sync.
    for (const id of teamIds) {
      await enqueue({ entityType: 'team', entityId: id, operation: 'update' })
    }
    for (const id of practiceIds) {
      await enqueue({ entityType: 'practice', entityId: id, operation: 'update' })
    }
  })
}
