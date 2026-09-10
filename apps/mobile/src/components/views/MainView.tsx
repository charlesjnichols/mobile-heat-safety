import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../../context/AppContext';
import { Practice, RootStackParamList } from '../../types';
import { getPracticeMaxHeatIndex, getPracticeChecklistCount } from '../../utils/practiceFilter';
import { SwipeableRow } from '../common/SwipeableRow';
import { Fab } from '../common/Fab';
import { HeatIndexIndicator } from '../common/HeatIndexIndicator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE } from '../../utils/outdoorColors';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const MainView = () => {
  const { state, dispatch } = useAppContext();
  const navigation = useNavigation<NavigationProp>();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Filter practices based on selected team
  const filteredPractices = useMemo(() => {
    let practices = state.data.data.practices;
    
    if (selectedTeam) {
      practices = practices.filter(practice => practice.teamId === selectedTeam);
    }
    
    // Sort by date (most recent first) without mutating the source array
    return [...practices].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.data.data.practices, selectedTeam]);

  const handlePracticePress = (practiceId: string) => {
    navigation.navigate('PracticeDetail', { practiceId });
  };

  const handleAddPractice = () => {
    navigation.navigate('PracticeForm', {});
  };

  const handleDeletePractice = (practice: Practice) => {
    Alert.alert('Delete practice', `Are you sure you want to delete ${practice.location}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            dispatch({ type: 'DELETE_PRACTICE', payload: practice.id });
          } catch (err) {
            console.error('Error deleting practice:', err);
            Alert.alert('Error', 'Failed to delete practice');
          }
        },
      },
    ]);
  };

  const renderPracticeCard = ({ item }: { item: Practice }) => {
    const maxHeatIndex = getPracticeMaxHeatIndex(item);
    const checklistCount = getPracticeChecklistCount(item);

    return (
      <SwipeableRow
        onDelete={() => handleDeletePractice(item)}
        deleteLabel={`Delete ${item.location}`}
        testID={`practice-${item.id}`}
      >
        <TouchableOpacity
          style={styles.practiceCard}
          onPress={() => handlePracticePress(item.id)}
          accessible={true}
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
              {checklistCount} checklists
            </Text>
          </View>
          {checklistCount > 0 && (
            <HeatIndexIndicator value={maxHeatIndex} size="small" variant="compact" />
          )}
        </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={PALETTE.NEUTRAL_400} />
      <Text style={styles.emptyText}>
        {selectedTeam ? 'No practices found' : 'No practices yet'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practices</Text>
      </View>

      {/* Team Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Team:</Text>
        <View style={styles.teamFilter}>
          <TouchableOpacity
            style={[
              styles.teamButton,
              !selectedTeam && styles.teamButtonActive,
            ]}
            onPress={() => setSelectedTeam(null)}
            accessible={true}
            accessibilityLabel="Show all teams"
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
              style={[
                styles.teamButton,
                selectedTeam === team.id && styles.teamButtonActive,
              ]}
              onPress={() => setSelectedTeam(team.id)}
              accessible={true}
              accessibilityLabel={`Filter by ${team.name}`}
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
        renderItem={renderPracticeCard}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Practice FAB (anchored to bottom of screen) */}
      <Fab
        onPress={handleAddPractice}
        accessibilityLabel="Add new practice"
        testID="fab-add-practice"
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  listContent: {
    paddingBottom: 20,
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
  safeArea: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  teamButton: {
    alignItems: 'center',
    backgroundColor: PALETTE.NEUTRAL_100,
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    minWidth: 88,
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

export default MainView;