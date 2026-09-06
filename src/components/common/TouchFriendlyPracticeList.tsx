import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
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
  grouping?: 'chronological' | 'by-team' | 'flat';
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
      case 'by-team':
        // This would be implemented with team sections
        return createChronologicalPracticeSections(sortedPractices);
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
  const handlePracticePress = (practiceId: string) => {
    if (enableHapticFeedback) {
      // Import and use haptic feedback
      // import { Haptic } from 'expo-haptics';
      // Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
    }
    onPracticePress?.(practiceId);
  };

  // Render section header
  const renderSectionHeader = ({ section }: { section: PracticeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle && (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      )}
    </View>
  );

  // Render practice item based on variant
  const renderPracticeItem = ({ item: practice }: { item: Practice }) => {
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
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
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
              <Ionicons name="list" size={16} color="#6b7280" />
              <Text style={styles.statText}>{checklistCount} checklists</Text>
            </View>
            {checklistCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="thermometer" size={16} color="#6b7280" />
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
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
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
  );

  // List component props
  const listProps = {
    data: sections,
    renderItem: ({ item: section }: { item: PracticeSection }) => (
      <View>
        {renderSectionHeader({ section })}
        <FlatList
          data={section.data}
          renderItem={renderPracticeItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
        />
      </View>
    ),
    ListEmptyComponent: renderEmptyState,
    ListHeaderComponent: grouping === 'flat' ? null : renderEmptyState,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: [styles.listContent, contentStyle],
    style,
  };

  return (
    <View style={[styles.container, style]}>
      {grouping === 'chronological' && sections.length > 0 && (
        <FlatList
          {...listProps}
        />
      )}
      
      {grouping === 'flat' && (
        <FlatList
          data={sortedPractices}
          renderItem={renderPracticeItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.flatListContent, contentStyle]}
          style={style}
        />
      )}
    </View>
  );
};

// Style definitions
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    backgroundColor: 'white',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 2,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  
  // Compact variant styles
  compactItem: {
    backgroundColor: 'white',
    borderBottomColor: '#e5e7eb',
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
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactCoach: {
    color: '#6b7280',
    fontSize: 14,
  },
  compactDateContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  compactDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  compactHeatIndicator: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },

  // List variant styles
  listItem: {
    backgroundColor: 'white',
    borderBottomColor: '#e5e7eb',
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
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listCoach: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 2,
  },
  listDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  heatIndicator: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  heatText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },

  // Card variant styles
  cardItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardCoach: {
    color: '#6b7280',
    fontSize: 14,
  },
  cardDate: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'right',
  },
  cardItemFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statText: {
    color: '#6b7280',
    fontSize: 14,
  },
  riskBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  riskText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Common styles
  teamColorDot: {
    borderColor: '#e5e7eb',
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default TouchFriendlyPracticeList;