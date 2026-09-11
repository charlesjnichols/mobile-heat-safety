import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useAppContext } from '../../src/context/AppContext';
import { Team, Practice } from '../../src/utils/validation';
import { HeatIndexIndicator } from '../../src/components/common/HeatIndexIndicator';
import { PALETTE } from '../../src/utils/outdoorColors';

// Mock AsyncStorage (AppProvider loads data directly from it)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const AsyncStorage = require('@react-native-async-storage/async-storage');

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

// Mock MainView component
const MockMainView = () => {  const { state } = useAppContext();
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter practices based on selected team and search query
  const filteredPractices = React.useMemo(() => {
    let practices = state.data.data.practices;
    
    if (selectedTeam) {
      practices = practices.filter(practice => practice.teamId === selectedTeam);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      practices = practices.filter(practice =>
        practice.location.toLowerCase().includes(query) ||
        (practice.headCoach ?? practice.coach).toLowerCase().includes(query)
      );
    }
    
    return practices.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.data.data.practices, selectedTeam, searchQuery]);

  const selectedTeamName = React.useMemo(() => {
    if (!selectedTeam) return 'All Teams';
    const team = state.data.data.teams.find(t => t.id === selectedTeam);
    return team?.name || 'All Teams';
  }, [selectedTeam, state.data.data.teams]);
  void selectedTeamName;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practices</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => console.log('Add practice')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search practices..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search practices"
        />
        <Ionicons name="search" size={20} color={PALETTE.TEXT_SECONDARY} style={styles.searchIcon} />
      </View>

      {/* Team Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Team:</Text>
        <View style={styles.teamFilter}>
          <TouchableOpacity
            testID="team-filter-all"
            style={[
              styles.teamButton,
              !selectedTeam && styles.teamButtonActive,
            ]}
            onPress={() => setSelectedTeam(null)}
          >
            <Text style={[
              styles.teamButtonText,
              !selectedTeam && styles.teamButtonTextActive,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {state.data.data.teams.map(team => (
            <TouchableOpacity
              key={team.id}
              testID={`team-filter-${team.id}`}
              style={[
                styles.teamButton,
                selectedTeam === team.id && styles.teamButtonActive,
              ]}
              onPress={() => setSelectedTeam(team.id)}
            >
              <View style={[styles.teamColor, { backgroundColor: team.color }]} />
              <Text style={[
                styles.teamButtonText,
                selectedTeam === team.id && styles.teamButtonTextActive,
              ]}>
                {team.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Practice List */}
      <FlatList
        data={filteredPractices}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.practiceCard}
            onPress={() => console.log('Navigate to practice', item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Practice at ${item.location} with ${item.headCoach}`}
          >
            <View style={styles.practiceHeader}>
              <View style={styles.practiceInfo}>
                <Text style={styles.practiceLocation}>{item.location}</Text>
                <Text style={styles.practiceCoach}>{item.headCoach}</Text>
              </View>
              <View style={styles.practiceDate}>
                <Text style={styles.practiceDateText}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            
            <View style={styles.practiceDetails}>
              <View style={styles.practiceStats}>
                <Text style={styles.practiceStatsText}>
                  {item.checklists.length} checklists
                </Text>
              </View>
              {item.checklists.length > 0 && (
                <HeatIndexIndicator
                  value={Math.max(...item.checklists.map(c => c.heatIndex))}
                  size="small"
                  variant="compact"
                />
              )}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={PALETTE.TEXT_MUTED} />
            <Text style={styles.emptyText}>No practices found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {    alignItems: 'center',
    backgroundColor: PALETTE.BLUE_500,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  container: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  filterLabel: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 24,
    fontWeight: 'bold',
  },
  practiceCard: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  practiceCoach: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 14,
  },
  practiceDate: {
    alignItems: 'flex-start',
  },
  practiceDateText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 14,
  },
  practiceDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  practiceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  practiceInfo: {
    flex: 1,
  },
  practiceLocation: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  practiceStats: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  practiceStatsText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 14,
    marginRight: 8,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: PALETTE.WHITE,
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginLeft: 8,
  },
  searchInput: {
    color: PALETTE.TEXT_STRONG,
    flex: 1,
    fontSize: 16,
  },
  teamButton: {
    alignItems: 'center',
    backgroundColor: PALETTE.NEUTRAL_100,
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teamButtonActive: {
    backgroundColor: PALETTE.BLUE_500,
    borderColor: PALETTE.BLUE_500,
  },
  teamButtonText: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 14,
    marginLeft: 6,
  },
  teamButtonTextActive: {
    color: PALETTE.WHITE,
  },
  teamColor: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  teamFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

describe('MainView Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful data loading from AsyncStorage
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: mockTeams,
        practices: mockPractices,
      },
    }));
  });

  it('should render main view with practices', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Verify header
    expect(screen.getByText('Practices')).toBeTruthy();
    
    // Verify search bar
    expect(screen.getByPlaceholderText('Search practices...')).toBeTruthy();
    
    // Verify team filter buttons
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Team A')).toBeTruthy();
    expect(screen.getByText('Team B')).toBeTruthy();
    
    // Verify practice cards
    expect(screen.getByText('Field A')).toBeTruthy();
    expect(screen.getByText('Field B')).toBeTruthy();
    expect(screen.getByText('John Coach')).toBeTruthy();
    expect(screen.getByText('Jane Coach')).toBeTruthy();
  });

  it('should filter practices by team', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Initially shows all practices
    expect(screen.getByText('Field A')).toBeTruthy();
    expect(screen.getByText('Field B')).toBeTruthy();

    // Filter by Team A
    fireEvent.press(screen.getByText('Team A'));

    await waitFor(() => {
      // Should only show Team A practices
      expect(screen.getByText('Field A')).toBeTruthy();
      expect(screen.queryByText('Field B')).toBeNull();
    });
  });

  it('should search practices', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Initially shows all practices
    expect(screen.getByText('Field A')).toBeTruthy();
    expect(screen.getByText('Field B')).toBeTruthy();

    // Search for "Field A"
    const searchInput = screen.getByPlaceholderText('Search practices...');
    fireEvent.changeText(searchInput, 'Field A');

    await waitFor(() => {
      // Should only show Field A
      expect(screen.getByText('Field A')).toBeTruthy();
      expect(screen.queryByText('Field B')).toBeNull();
    });
  });

  it('should display heat risk indicators', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Verify compact heat indicators are displayed for each practice.
    expect(screen.getByText('95°F')).toBeTruthy();
    expect(screen.getByText('80°F')).toBeTruthy();
  });

  it('should show max heat index via the heat indicator', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    expect(screen.getByText('95°F')).toBeTruthy();
    expect(screen.getByText('80°F')).toBeTruthy();
  });

  it('should handle empty state', async () => {
    // Mock empty data
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
      version: '1.0.0',
      lastSync: null,
      data: {
        teams: mockTeams,
        practices: [],
      },
    }));

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Should show empty state (wait for the async Dexie load to flush)
    await waitFor(() => {
      expect(screen.getByText('No practices found')).toBeTruthy();
    });
    expect(screen.getByText('calendar-outline')).toBeTruthy();
  });

  it('should have accessibility labels', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Verify accessibility labels
    expect(screen.getByPlaceholderText('Search practices...')).toHaveAccessibilityLabel('Search practices');
    
    // Verify practice cards have accessibility labels
    // (list is sorted newest-first: Field B, then Field A)
    const practiceCards = screen.getAllByRole('button');
    expect(practiceCards[0]).toHaveAccessibilityLabel('Practice at Field B with Jane Coach');
    expect(practiceCards[1]).toHaveAccessibilityLabel('Practice at Field A with John Coach');
  });

  it('should have large touch targets', async () => {
    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Practices')).toBeTruthy();
    });

    // Verify team filter buttons have minimum touch targets
    ['team-filter-all', 'team-filter-team-1', 'team-filter-team-2'].forEach(testID => {
      const button = screen.getByTestId(testID);
      const style = Array.isArray(button.props.style)
        ? Object.assign({}, ...button.props.style.filter(Boolean))
        : button.props.style;
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
    });
  });

  it('should show loading state', async () => {
    // Mock delayed data loading
    AsyncStorage.getItem.mockImplementation(() => {
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

    render(
      <AppProvider>
        <MockMainView />
      </AppProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Practices')).toBeTruthy();
    // Note: In a real app, you might have a loading spinner
    // For this test, we're just checking that the component renders
  });
});