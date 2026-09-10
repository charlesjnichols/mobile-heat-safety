import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

// Import types and utilities
import { Practice, Checklist, Team } from '../../types';
import { getRiskLevel, getHeatIndexColor } from '../../utils/heatIndex';
import { APP_CONSTANTS } from '../../types';
import { HapticFeedback } from '../../utils/hapticFeedback';

// Import components
import { HeatIndexIndicator } from '../common/HeatIndexIndicator';
import { OverflowMenu } from '../common/OverflowMenu';
import { Fab } from '../common/Fab';
import { formatTime12 } from '../../utils/dateTime';
import { SwipeableRow } from '../common/SwipeableRow';
import { SafeAreaView } from 'react-native-safe-area-context';

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS;

const HEAT_STRESS_ACTION_LEVELS: { range: string; guidance: string }[] = [
  { range: '80–89°F', guidance: 'Encourage hydration, schedule rest breaks, provide shade.' },
  { range: '90–99°F', guidance: 'Mandatory rest breaks (10 minutes per 2 hours), closely monitor employees.' },
  { range: '100+°F', guidance: 'Increase breaks (15 minutes per hour), provide cooling measures (fans, shade, cool-down area).' },
];

const MAX_NOTES_LENGTH = 2000;

interface PracticeDetailViewProps {
  navigation?: unknown;
  route?: unknown;
}

const PracticeDetailView: React.FC<PracticeDetailViewProps> = (props) => {
  const navigation = props.navigation as {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  const { state, dispatch } = useAppContext();
  const { practiceId } = (props.route as { params: { practiceId: string } }).params;

  // Practice and team are derived from shared state (single source of truth).
  const practice = state.data.data.practices.find((p: Practice) => p.id === practiceId) ?? null;
  const team = practice
    ? state.data.data.teams.find((t: Team) => t.id === practice.teamId) ?? null
    : null;
  const loading = state.loading;
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Keep the notes text field synced to the practice's persisted notes whenever
  // the practice is (re)loaded into shared state.
  const practiceNotes = practice?.notes ?? ''
  useEffect(() => {
    setNotes(practiceNotes)
  }, [practiceNotes]);

  // Handle add checklist entry
  const handleAddChecklist = () => {
    HapticFeedback.light();
    navigation.navigate('ChecklistForm', {
      practiceId,
      isEdit: false,
    });
  };

  // Handle edit checklist entry
  const handleEditChecklist = (checklist: Checklist) => {
    HapticFeedback.light();
    navigation.navigate('ChecklistForm', {
      practiceId,
      checklistId: checklist.id,
      isEdit: true,
    });
  };

  // Handle delete checklist entry
  const handleDeleteChecklist = async (checklistId: string) => {
    if (!practice) return;

    try {
      // Update shared state so practice detail/list reflect the change immediately;
      // the provider's auto-save persists the change.
      dispatch({ type: 'DELETE_CHECKLIST', payload: { practiceId, checklistId } });

      HapticFeedback.success();
      Alert.alert('Success', 'Checklist entry deleted');
    } catch (err) {
      console.error('Error deleting checklist:', err);
      Alert.alert('Error', 'Failed to delete checklist entry');
    }
  };

  // Handle delete practice
  const handleDeletePractice = async () => {
    if (!practice) return;

    Alert.alert('Delete practice', `Are you sure you want to delete ${practice.location}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Update shared state so the practice list reflects the deletion immediately,
            // and the provider's auto-save persists the change.
            dispatch({ type: 'DELETE_PRACTICE', payload: practiceId });

            HapticFeedback.success();
            Alert.alert('Success', 'Practice deleted');
            navigation.goBack();
          } catch (err) {
            console.error('Error deleting practice:', err);
            Alert.alert('Error', 'Failed to delete practice');
          }
        },
      },
    ]);
  };

  // Handle save notes
  const handleSaveNotes = () => {
    if (!practice) return;
    const trimmed = notes.length > MAX_NOTES_LENGTH ? notes.slice(0, MAX_NOTES_LENGTH) : notes;
    HapticFeedback.light();
    const updatedPractice = { ...practice, notes: trimmed, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_PRACTICE', payload: updatedPractice });
    setNotes(trimmed);
    setSavingNotes(true);
    // The save is immediate (dispatch is synchronous); clear the busy flag on
    // the next frame so the button briefly reflects the in-flight state.
    requestAnimationFrame(() => setSavingNotes(false));
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      HapticFeedback.light();

      if (!practice) return;

      const checklistCount = practice.checklists.length;
      const maxHeatIndex = checklistCount > 0
        ? Math.max(...practice.checklists.map((c: Checklist) => c.heatIndex))
        : 0;
      const averageHeatIndex = checklistCount > 0
        ? practice.checklists.reduce((sum: number, c: Checklist) => sum + c.heatIndex, 0) / checklistCount
        : 0;

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        practice: {
          ...practice,
          team: team,
          maxHeatIndex,
          averageHeatIndex,
        },
      };

      const shareOptions = {
        title: 'Heat Safety Practice Data',
        message: JSON.stringify(exportData, null, 2),
        url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`,
      };

      await Share.share(shareOptions);
    } catch (err) {
      console.error('Error exporting data:', err);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  // Calculate maximum heat index for display
  const maxHeatIndex = practice && practice.checklists.length > 0 ? Math.max(...practice.checklists.map((c: Checklist) => c.heatIndex)) : 0;
  const riskLevel = getRiskLevel(maxHeatIndex);
  const riskColor = getHeatIndexColor(maxHeatIndex);

  // Render checklist item
  const renderChecklistItem = ({ item }: { item: Checklist }) => {
    return (
      <SwipeableRow
        onDelete={() => handleDeleteChecklist(item.id)}
        deleteLabel="Delete"
        testID={`checklist-${item.id}`}
      >
        <TouchableOpacity
          style={styles.checklistItem}
          onPress={() => handleEditChecklist(item)}
          accessible={true}
          accessibilityLabel={`Checklist entry: ${formatTime12(item.time)}, heat index ${item.heatIndex}°F, ${item.actionTaken}`}
          accessibilityHint="Tap to edit checklist entry"
        >
          <View style={styles.checklistText}>
            <Text style={styles.checklistTimeText}>{formatTime12(item.time)}</Text>
            <View style={styles.checklistHeat}>
              <HeatIndexIndicator value={item.heatIndex} size="small" variant="compact" />
            </View>
            <Text style={styles.checklistActionText} numberOfLines={2} ellipsizeMode="tail">
              {item.actionTaken}
            </Text>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading practice data...</Text>
      </View>
    );
  }

  if (!practice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Practice not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {practice.location} on {new Date(practice.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        <OverflowMenu
          items={[
            {
              key: 'export',
              label: 'Export',
              icon: 'share-outline',
              onPress: handleExportData,
            },
            {
              key: 'delete',
              label: 'Delete Practice',
              icon: 'trash-outline',
              destructive: true,
              onPress: handleDeletePractice,
            },
          ]}
        />
      </View>

      {/* Practice Information */}
      <View
        style={styles.content}
      >
        {/* Practice Header */}
        <View style={styles.practiceHeader}>
          <View style={styles.practiceInfo}>
            <Text style={styles.practiceCoach}>{practice.headCoach}</Text>
            {team && (
              <View style={[styles.teamBadge, { backgroundColor: team.color }]}>
                <Text style={styles.teamName}>{team.name}</Text>
              </View>
            )}
          </View>

          <View
            style={styles.heatSummary}
            accessible={true}
            accessibilityLabel={`${maxHeatIndex}°F - ${riskLevel} Risk`}
          >
            <HeatIndexIndicator value={maxHeatIndex} size="medium" />
            <Text style={[styles.riskLevelText, { color: riskColor }]}>
              {riskLevel} Risk
            </Text>
          </View>
        </View>

        {/* Additional Notes & Observations */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Additional Notes & Observations</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Enter notes and observations about this practice"
            placeholderTextColor={COLORS.TEXT_SECONDARY}
            maxLength={MAX_NOTES_LENGTH}
            accessible={true}
            accessibilityLabel="Additional notes and observations"
            accessibilityHint="Enter free-form notes about this practice"
            testID="notes-input"
          />
          <TouchableOpacity
            style={[styles.notesSaveButton, savingNotes && styles.notesSaveButtonDisabled]}
            onPress={handleSaveNotes}
            accessible={true}
            accessibilityLabel="Save notes button"
            accessibilityHint="Tap to save additional notes"
            testID="save-notes-button"
          >
            <Text style={styles.notesSaveButtonText}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Heat Stress Action Levels */}
        <View style={styles.heatLevelsSection}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistTitle}>Heat Stress Action Levels</Text>
          </View>
          {HEAT_STRESS_ACTION_LEVELS.map((level) => (
            <View key={level.range} style={styles.heatLevelRow} testID={`heat-level-${level.range}`}>
              <Text style={styles.heatLevelRange}>{level.range}</Text>
              <Text style={styles.heatLevelGuidance}>{level.guidance}</Text>
            </View>
          ))}
        </View>

        {/* Checklist Table */}
        <View style={styles.checklistSection}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistTitle}>Heat Safety Checklist</Text>
            <Text style={styles.checklistCount}>
              {practice.checklists.length} entries
            </Text>
          </View>

          {practice.checklists.length > 0 ? (
            <FlatList
              data={practice.checklists}
              keyExtractor={(item: Checklist) => item.id}
              renderItem={renderChecklistItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              style={styles.checklistList}
              contentContainerStyle={styles.checklistListContent}
              testID="checklist-list"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No checklist entries yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Add entries to track heat safety during practice
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Add Checklist FAB (anchored to bottom of screen) */}
      <Fab
        onPress={handleAddChecklist}
        accessibilityLabel="Add checklist entry"
        testID="fab-add-checklist"
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  checklistActionText: {
    color: COLORS.TEXT_SECONDARY,
    flexShrink: 1,
    fontSize: FONT_SIZES.BODY,
    textAlign: 'left',
  },
  checklistCount: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.BODY,
  },
  checklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  checklistHeat: {
    marginHorizontal: SPACING.XS,
  },
  checklistItem: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    minHeight: 60,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  checklistList: {
    borderColor: COLORS.BORDER,
    borderRadius: SPACING.SM,
    borderWidth: 1,
    overflow: 'hidden',
  },
  checklistListContent: {
    // Ensure the last entry clears the FAB on whole-page scroll.
    paddingBottom: SPACING.XL,
  },
  checklistSection: {
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.MD,
  },
  checklistText: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
  },
  checklistTimeText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  checklistTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.HEADLINE,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: COLORS.BACKGROUND,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    padding: SPACING.LG,
  },
  emptyStateSubtext: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.CAPTION,
    lineHeight: FONT_SIZES.BODY,
    textAlign: 'center',
  },
  emptyStateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.BODY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.BODY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.MD,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: FONT_SIZES.TITLE,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  heatLevelGuidance: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.BODY,
    marginTop: SPACING.XS,
  },
  heatLevelRange: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: 'bold',
  },
  heatLevelRow: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  heatLevelsSection: {
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.MD,
  },
  heatSummary: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.MD,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    marginTop: SPACING.MD,
  },
  notesInput: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderColor: COLORS.BORDER,
    borderRadius: SPACING.SM,
    borderWidth: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    minHeight: 100,
    padding: SPACING.MD,
    textAlignVertical: 'top',
  },
  notesSaveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.SM,
    justifyContent: 'center',
    marginTop: SPACING.SM,
    minHeight: 44,
    padding: SPACING.MD,
  },
  notesSaveButtonDisabled: {
    opacity: 0.7,
  },
  notesSaveButtonText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  notesSection: {
    marginBottom: SPACING.LG,
    marginHorizontal: SPACING.MD,
  },
  notesTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.HEADLINE,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  practiceCoach: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.BODY,
    marginBottom: SPACING.MD,
  },
  practiceHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: SPACING.MD,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: SPACING.MD,
    padding: SPACING.LG,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  practiceInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  retryButtonText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  riskLevelText: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: COLORS.BACKGROUND,
    flex: 1,
  },
  teamBadge: {
    alignSelf: 'flex-start',
    borderRadius: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  teamName: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
});

export { PracticeDetailView };
export default PracticeDetailView;