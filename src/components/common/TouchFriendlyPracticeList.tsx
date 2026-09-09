import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ListRenderItem,
  SectionListData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';
import { Practice } from '../../types';
import {
  getPracticeRiskLevel,
  getPracticeRiskColor,
  getPracticeMaxHeatIndex,
  getPracticeChecklistCount,
} from '../../utils/practiceFilter';
import {
  sortPracticesForMobile,
  formatDate,
  formatRelativeTime,
  createChronologicalPracticeSections,
} from '../../utils/mobileDateUtils';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { PALETTE } from '../../utils/outdoorColors';

// Touch target size constants (minimum 44x44 points for accessibility)
const MIN_TOUCH_TARGET = 44;
const LARGE_TOUCH_TARGET = 56;

// Practice list section
type PracticeSection = {
  id: string;
  title: string;
  subtitle?: string;
  data: Practice[];
  type: 'date' | 'team' | 'month';
};

interface TouchFriendlyPracticeListProps {
  onPracticePress?: (practiceId: string) => void;
  onTeamFilter?: (teamId: string) => void;
  showTeamColors?: boolean;
  variant?: 'list' | 'card' | 'compact';
  grouping?: 'chronological' | 'flat';
  enableHapticFeedback?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const TouchFriendlyPracticeList: React.FC<TouchFriendlyPracticeListProps> = ({
  onPracticePress,
  showTeamColors = true,
  variant = 'card',
  grouping = 'chronological',
  enableHapticFeedback = true,
  style,
  contentStyle,
}) => {
  const { state } = useAppContext();

  // Sort practices for mobile
  const sortedPractices = useMemo(() => sortPracticesForMobile(state.data.data.practices), [state.data.data.practices]);

  // Team colors by team id
  const teamColors = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    state.data.data.teams.forEach(team => {
      map[team.id] = team.color;
    });
    return map;
  }, [state.data.data.teams]);

  // Create sections based on grouping preference
  const sections = useMemo((): PracticeSection[] => {
    switch (grouping) {
      case 'flat':
        return [{
          id: 'all-practices',
          title: 'All Practices',
          data: sortedPractices,
          type: 'date' as const,
        }];
      default: // chronological
        return createChronologicalPracticeSections(sortedPractices);
    }
  }, [sortedPractices, grouping]);

  // Handle practice press with haptic feedback
  const handlePracticePress = useCallback((practiceId: string) => {
    if (enableHapticFeedback) {
      HapticFeedback.light();
    }
    onPracticePress?.(practiceId);
  }, [enableHapticFeedback, onPracticePress]);

  // Render section header
  const renderSectionHeader = useCallback(({ section }: { section: SectionListData<Practice, PracticeSection> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle && (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      )}
    </View>
  ), []);

  // Render practice item based on variant
  const renderPracticeItem: ListRenderItem<Practice> = useCallback(({ item: practice }) => {
    const riskLevel = getPracticeRiskLevel(practice);
    const riskColor = getPracticeRiskColor(practice);
    const maxHeatIndex = getPracticeMaxHeatIndex(practice);
    const checklistCount = getPracticeChecklistCount(practice);

    if (variant === 'compact') {
      return (
        <TouchableOpacity
          style={[styles.compactItem, { minHeight: MIN_TOUCH_TARGET }]}
          onPress={() => handlePracticePress(practice.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Practice at ${practice.location} with ${practice.headCoach}`}
          activeOpacity={0.7}
        >
          <View style={styles.compactItemContent}>
            <View style={styles.compactItemLeft}>
              <Text style={styles.compactLocation}>{practice.location}</Text>
              <Text style={styles.compactCoach}>{practice.headCoach}</Text>
            </View>
            <View style={styles.compactItemRight}>
              <View style={styles.compactDateContainer}>
                <Text style={styles.compactDate}>{formatDate(practice.date, 'short')}</Text>
              </View>
              {checklistCount > 0 && (
                <View style={[styles.compactHeatIndicator, { backgroundColor: riskColor }]} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    if (variant === 'list') {
      return (
        <TouchableOpacity
          style={[styles.listItem, { minHeight: LARGE_TOUCH_TARGET }]}
          onPress={() => handlePracticePress(practice.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Practice at ${practice.location} with ${practice.headCoach}`}
          activeOpacity={0.7}
        >
          <View style={styles.listItemContent}>
            <View style={styles.listItemLeft}>
              {showTeamColors && (
                <View style={[styles.teamColorDot, { backgroundColor: teamColors[practice.teamId] }]} />
              )}
              <View style={styles.listItemText}>
                <Text style={styles.listLocation}>{practice.location}</Text>
                <Text style={styles.listCoach}>{practice.headCoach}</Text>
                <Text style={styles.listDate}>
                  {formatDate(practice.date, 'medium')} • {formatRelativeTime(practice.date)}
                </Text>
              </View>
            </View>
            <View style={styles.listItemRight}>
              {checklistCount > 0 && (
                <>
                  <View style={[styles.heatIndicator, { backgroundColor: riskColor }]} />
                  <Text style={styles.heatText}>{maxHeatIndex}°F</Text>
                </>
              )}
              <Ionicons name="chevron-forward" size={20} color={PALETTE.NEUTRAL_400} />
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Default card variant
    return (
      <TouchableOpacity
        style={[styles.cardItem, { minHeight: LARGE_TOUCH_TARGET + 20 }]}
        onPress={() => handlePracticePress(practice.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Practice at ${practice.location} with ${practice.headCoach}`}
        activeOpacity={0.7}
      >
        <View style={styles.cardItemHeader}>
          <View style={styles.cardItemLeft}>
            {showTeamColors && (
              <View style={[styles.teamColorDot, { backgroundColor: teamColors[practice.teamId] }]} />
            )}
            <View>
              <Text style={styles.cardLocation}>{practice.location}</Text>
              <Text style={styles.cardCoach}>{practice.headCoach}</Text>
            </View>
          </View>
          <View style={styles.cardItemRight}>
            <Text style={styles.cardDate}>
              {formatDate(practice.date, 'medium')}
            </Text>
          </View>
        </View>

        <View style={styles.cardItemFooter}>
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Ionicons name="list" size={16} color={PALETTE.NEUTRAL_500} />
              <Text style={styles.statText}>{checklistCount} checklists</Text>
            </View>
            {checklistCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="thermometer" size={16} color={PALETTE.NEUTRAL_500} />
                <Text style={styles.statText}>{maxHeatIndex}°F</Text>
              </View>
            )}
          </View>

          {checklistCount > 0 && (
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskText}>{riskLevel}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [variant, showTeamColors, teamColors, handlePracticePress]);

  // Render empty state (only shown when there are no practices at all)
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color={PALETTE.NEUTRAL_400} />
      <Text style={styles.emptyText}>
        {state.data.data.practices.length === 0
          ? 'No practices yet'
          : 'No practices found'
        }
      </Text>
      {state.data.data.practices.length === 0 && (
        <Text style={styles.emptySubText}>
          Create your first practice to get started
        </Text>
      )}
    </View>
  ), [state.data.data.practices.length]);

  return (
    <View style={[styles.container, style]}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderPracticeItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, contentStyle]}
      />
    </View>
  );
};

// Style definitions
const styles = StyleSheet.create({
  cardCoach: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
  },
  cardDate: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
    textAlign: 'right',
  },
  cardItem: {
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
  cardItemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  cardItemRight: {
    alignItems: 'flex-start',
  },
  cardLocation: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  compactCoach: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
  },
  compactDate: {
    color: PALETTE.NEUTRAL_400,
    fontSize: 12,
  },
  compactDateContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  compactHeatIndicator: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  compactItem: {
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactItemLeft: {
    flex: 1,
  },
  compactItemRight: {
    alignItems: 'flex-end',
  },
  compactLocation: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
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
  emptySubText: {
    color: PALETTE.NEUTRAL_400,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  heatIndicator: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  heatText: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  listCoach: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
    marginBottom: 2,
  },
  listContent: {
    paddingBottom: 20,
  },
  listDate: {
    color: PALETTE.NEUTRAL_400,
    fontSize: 12,
  },
  listItem: {
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  listItemRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  listItemText: {
    flex: 1,
    marginLeft: 12,
  },
  listLocation: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  riskBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskText: {
    color: PALETTE.WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: PALETTE.WHITE,
    borderBottomColor: PALETTE.NEUTRAL_200,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionSubtitle: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 16,
    fontWeight: '600',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statText: {
    color: PALETTE.NEUTRAL_500,
    fontSize: 14,
  },
  teamColorDot: {
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
});

export default TouchFriendlyPracticeList;