import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEY, getDefaultData } from '../utils/storage'
import { Team, Practice, Checklist, HeatSafetyData } from '../types'

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
      const existingTeamIds = new Set(state.data.data.teams.map(team => team.id))
      const existingPracticeIds = new Set(state.data.data.practices.map(practice => practice.id))
      return {
        ...state,
        data: {
          ...state.data,
          data: {
            teams: [
              ...state.data.data.teams,
              ...action.payload.teams.filter(team => !existingTeamIds.has(team.id)),
            ],
            practices: [
              ...state.data.data.practices,
              ...action.payload.practices.filter(practice => !existingPracticeIds.has(practice.id)),
            ],
          },
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
    default:
      return state
  }
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

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        const storedData = await AsyncStorage.getItem(STORAGE_KEY)
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          dispatch({ type: 'SET_DATA', payload: parsedData })
        } else {
          // Save initial data to storage
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialState.data))
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error loading data:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' })
      }
    }

    loadData()
  }, [])

  // Auto-save data when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.data))
        // Clear a previous transient save error so persistence can continue
        if (state.error === SAVE_ERROR_MESSAGE) {
          dispatch({ type: 'SET_ERROR', payload: null })
        }
      } catch (error) {
        console.error('Error saving data:', error)
        dispatch({ type: 'SET_ERROR', payload: SAVE_ERROR_MESSAGE })
      }
    }

    // Save whenever data changes and we are not mid-load. A previous SAVE error
    // must not permanently suppress persistence, but a LOAD error must, so we
    // never overwrite good stored data with the seeded fallback state.
    if (!state.loading && state.error !== 'Failed to load data') {
      saveData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data, state.loading])

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
