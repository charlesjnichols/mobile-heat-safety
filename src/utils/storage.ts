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
      return parsed;
    }
    return getDefaultData();
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

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

  // Sort by date (most recent first)
  return [...practices].sort((a: Practice, b: Practice) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};