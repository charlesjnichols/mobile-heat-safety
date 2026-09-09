import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeatSafetyData, Practice } from '../types';

// Storage key constants
export const STORAGE_KEY = 'heatSafetyData';
export const DATA_VERSION = '1.0.0';

// Default data structure
export const getDefaultData = (): HeatSafetyData => ({
  version: DATA_VERSION,
  lastSync: null,
  data: {
    teams: [],
    practices: [],
  },
});

export const loadData = async (): Promise<HeatSafetyData> => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData) as HeatSafetyData;
      // Validate version compatibility
      if (parsed.version !== DATA_VERSION) {
        console.log('Data version mismatch, using default data');
        return getDefaultData();
      }
      // Shape-validate nested fields so malformed payloads never crash getTeams/getPractices
      if (!isValidDataShape(parsed)) {
        console.log('Malformed data shape, using default data');
        return getDefaultData();
      }
      return parsed;
    }
    return getDefaultData();
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

// Ensure the top-level nested collections are arrays of objects.
const isValidDataShape = (data: HeatSafetyData): boolean => {
  const collections = data?.data
  if (!collections || !Array.isArray(collections.teams) || !Array.isArray(collections.practices)) {
    return false
  }
  return collections.teams.every(isObject) && collections.practices.every(isObject)
}

const isObject = (value: unknown): boolean => typeof value === 'object' && value !== null && !Array.isArray(value)

// Read-only utility functions for data access
export const getTeams = async () => {
  const data = await loadData();
  return data.data.teams;
};

export const getPractices = async (teamId?: string) => {
  const data = await loadData();
  let practices = data.data.practices;

  if (teamId) {
    practices = practices.filter((practice: Practice) => practice.teamId === teamId);
  }

  // Sort by date (most recent first); guard invalid dates so NaN compares deterministically
  return [...practices].sort((a: Practice, b: Practice) => {
    const aTime = new Date(a.date).getTime()
    const bTime = new Date(b.date).getTime()
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
    if (Number.isNaN(aTime)) return 1 // invalid dates sort last
    if (Number.isNaN(bTime)) return -1
    return bTime - aTime
  });
};