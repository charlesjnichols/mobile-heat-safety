import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import { AppProvider, useAppContext } from '../../src/context/AppContext';
import { Team, Practice } from '../../src/utils/validation';

// Mock the storage module
jest.mock('../../src/utils/storage', () => ({
  loadData: jest.fn(),
  saveData: jest.fn(),
  getTeams: jest.fn(),
  getPractices: jest.fn(),
}));

const { loadData, getTeams, getPractices } = require('@/utils/storage');

// Mock the practiceFilter module
jest.mock('@/utils/practiceFilter', () => ({
  filterPracticesByTeam: jest.fn(),
  sortPracticesByDate: jest.fn(),
  getTeamPractices: jest.fn(),
  getTeamsWithPracticeCounts: jest.fn(),
}));

const { 
  filterPracticesByTeam, 
  sortPracticesByDate, 
  getTeamPractices, 
  getTeamsWithPracticeCounts 
} = require('@/utils/practiceFilter');

// Mock the heatIndex module
jest.mock('@/utils/heatIndex', () => ({
  getHeatIndexResult: jest.fn(),
}));

const { getHeatIndexResult } = require('@/utils/heatIndex');

// Mock the AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock the navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  useRoute: () => ({
    params: {},
  }),
}));

// Test data
const mockTeams: Team[] = [
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
];

const mockPractices: Practice[] = [
  {
    id: 'practice-1',
    name: 'Morning Practice',
    date: '2026-09-01',
    location: 'Field A',
    headCoach: 'John Coach',
    coach: 'John Coach',
    sport: 'Soccer',
    contactInfo: 'john@example.com',
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
    headCoach: 'Jane Coach',
    coach: 'Jane Coach',
    sport: 'Soccer',
    contactInfo: 'jane@example.com',
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
];

describe('Practice List Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful data loading
    (loadData as jest.Mock).mockResolvedValue({
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: mockTeams,
        practices: mockPractices,
      },
    });
    
    (getTeams as jest.Mock).mockResolvedValue(mockTeams);
    (getPractices as jest.Mock).mockResolvedValue(mockPractices);
    
    // Mock filter and sort functions
    (filterPracticesByTeam as jest.Mock).mockReturnValue(mockPractices);
    (sortPracticesByDate as jest.Mock).mockReturnValue(mockPractices);
    (getTeamPractices as jest.Mock).mockReturnValue(mockPractices);
    (getTeamsWithPracticeCounts as jest.Mock).mockReturnValue(mockTeams);
    
    // Mock heat index calculation
    (getHeatIndexResult as jest.Mock).mockReturnValue({
      value: 90,
      riskLevel: 'MODERATE' as const,
      color: '#eab308',
      timestamp: new Date(),
    });
  });

  it('should load and display practices successfully', async () => {
    // Mock the MainView component for testing
    const MockMainView = () => {
      const { state } = useAppContext();
      
      return (
        <View>
          <Text>Practices Loaded</Text>
          <Text>
            Total Practices: {state.data.data.practices.length}
          </Text>
          {state.data.data.practices.map((practice) => (
            <View key={practice.id}>
              <Text>{practice.location}</Text>
              <Text>{practice.headCoach}</Text>
            </View>
          ))}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices Loaded')).toBeTruthy();
      expect(screen.getByText('Total Practices: 2')).toBeTruthy();
    });

    // Verify that practices are displayed
    expect(screen.getByText('Field A')).toBeTruthy();
    expect(screen.getByText('Field B')).toBeTruthy();
    expect(screen.getByText('John Coach')).toBeTruthy();
    expect(screen.getByText('Jane Coach')).toBeTruthy();
  });

  it('should filter practices by team', async () => {
    const MockMainView = () => {
      const { state } = useAppContext();
      const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);
      
      const filteredPractices = React.useMemo(() => {
        if (!selectedTeam) return state.data.data.practices;
        return state.data.data.practices.filter(practice => practice.teamId === selectedTeam);
      }, [state.data.data.practices, selectedTeam]);

      return (
        <View>
          <Text>Team Filtered Practices</Text>
          <Text>
            Filtered Count: {filteredPractices.length}
          </Text>
          <Button
            title="Filter Team A"
            onPress={() => setSelectedTeam('team-1')}
          />
          {filteredPractices.map((practice) => (
            <View key={practice.id}>
              <Text>{practice.location}</Text>
            </View>
          ))}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Team Filtered Practices')).toBeTruthy();
    });

    // Initially shows all practices
    expect(screen.getByText('Filtered Count: 2')).toBeTruthy();

    // Filter by Team A
    fireEvent.press(screen.getByText('Filter Team A'));
    
    await waitFor(() => {
      expect(screen.getByText('Filtered Count: 1')).toBeTruthy();
      expect(screen.getByText('Field A')).toBeTruthy();
    });
  });

  it('should display teams with practice counts', async () => {
    const MockMainView = () => {
      const { state } = useAppContext();
      
      const teamsWithCounts = React.useMemo(() => {
        return state.data.data.teams.map(team => ({
          ...team,
          practiceCount: state.data.data.practices.filter(p => p.teamId === team.id).length,
        }));
      }, [state.data.data.teams, state.data.data.practices]);

      return (
        <View>
          <Text>Teams with Practice Counts</Text>
          {teamsWithCounts.map((team) => (
            <View key={team.id}>
              <Text>{team.name}</Text>
              <Text>Practices: {team.practiceCount}</Text>
            </View>
          ))}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Teams with Practice Counts')).toBeTruthy();
    });

    // Verify team names and practice counts
    expect(screen.getByText('Team A')).toBeTruthy();
    expect(screen.getByText('Team B')).toBeTruthy();
    expect(screen.getAllByText('Practices: 1')).toHaveLength(2);
  });

  it('should handle loading state', async () => {
    // Mock loading state via the AsyncStorage source that the Dexie migration reads
    const mockAsyncStorage = require('@react-native-async-storage/async-storage');
    (mockAsyncStorage.getItem as jest.Mock).mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(JSON.stringify({
          version: '1.0.0',
          lastSync: null,
          data: {
            teams: mockTeams,
            practices: mockPractices,
          },
        })), 100);
      });
    });

    const MockMainView = () => {
      const { state } = useAppContext();
      
      return (
        <View>
          {state.loading ? (
            <Text>Loading...</Text>
          ) : (
            <Text>Loaded: {state.data.data.practices.length} practices</Text>
          )}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeTruthy();

    // Should show loaded data after async operation
    await waitFor(() => {
      expect(screen.getByText('Loaded: 2 practices')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('should handle error state', async () => {
    // Mock error state by making storage read fail
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockRejectedValue(new Error('Failed to load data'));

    const MockMainView = () => {
      const { state } = useAppContext();
      
      return (
        <View>
          {state.error ? (
            <Text>Error: {state.error}</Text>
          ) : (
            <Text>No Error</Text>
          )}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load data')).toBeTruthy();
    });
  });

  it('should sort practices by date (most recent first)', async () => {
    const MockMainView = () => {
      const { state } = useAppContext();
      
      const sortedPractices = React.useMemo(() => {
        return [...state.data.data.practices].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }, [state.data.data.practices]);

      return (
        <View>
          <Text>Sorted Practices</Text>
          {sortedPractices.map((practice, index) => (
            <View key={practice.id}>
              <Text>{index + 1}. {practice.date} - {practice.location}</Text>
            </View>
          ))}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sorted Practices')).toBeTruthy();
    });

    // Verify sorting (most recent first)
    const practiceItems = screen.getAllByText(/- Field/);
    expect(practiceItems[0]).toHaveTextContent('2026-09-02 - Field B');
    expect(practiceItems[1]).toHaveTextContent('2026-09-01 - Field A');
  });

  it('should navigate to practice details', async () => {
    const mockNavigate = jest.fn();
    
    // Mock navigation
    jest.mocked(require('@react-navigation/native').useNavigation).mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
    });

    const MockMainView = () => {
      const { state } = useAppContext();
      
      return (
        <View>
          <Text>Practice List</Text>
          {state.data.data.practices.map((practice) => (
            <TouchableOpacity
              key={practice.id}
              onPress={() => mockNavigate('PracticeDetail', { practiceId: practice.id })}
            >
              <Text>{practice.location}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practice List')).toBeTruthy();
    });

    // Tap on a practice to navigate
    fireEvent.press(screen.getByText('Field A'));
    
    expect(mockNavigate).toHaveBeenCalledWith('PracticeDetail', {
      practiceId: 'practice-1',
    });
  });

  it('should display heat risk indicators', async () => {
    const MockMainView = () => {
      const { state } = useAppContext();
      
      return (
        <View>
          <Text>Heat Risk Indicators</Text>
          {state.data.data.practices.map((practice) => {
            const maxHeatIndex = Math.max(...practice.checklists.map(c => c.heatIndex));
            const riskLevel = maxHeatIndex <= 80 ? 'LOW' : 
                              maxHeatIndex <= 90 ? 'MODERATE' : 
                              maxHeatIndex <= 105 ? 'HIGH' : 'EXTREME';
            
            return (
              <View key={practice.id}>
                <Text>{practice.location}: {riskLevel} Risk</Text>
              </View>
            );
          })}
        </View>
      );
    };

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Heat Risk Indicators')).toBeTruthy();
    });

    // Verify heat risk indicators
    expect(screen.getByText('Field A: HIGH Risk')).toBeTruthy();
    expect(screen.getByText('Field B: LOW Risk')).toBeTruthy();
  });
});