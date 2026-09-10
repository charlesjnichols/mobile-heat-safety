import React, { useMemo, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { PALETTE } from '../../utils/outdoorColors'
import { Team, APP_CONSTANTS, MainTabParamList } from '../../types'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS

type TeamPickerNavigation = BottomTabNavigationProp<MainTabParamList>

interface TeamPickerSheetProps {
  teams: Team[]
  selectedTeamId: string
  visible: boolean
  onSelect: (teamId: string) => void
  onClose: () => void
}

const TeamPickerSheet: React.FC<TeamPickerSheetProps> = ({
  teams,
  selectedTeamId,
  visible,
  onSelect,
  onClose,
}) => {
  const navigation = useNavigation<TeamPickerNavigation>()

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  )

  const handleCreateTeam = useCallback(() => {
    onClose()
    // Navigate to the Teams tab, where a new team can be created.
    navigation.navigate('Teams')
  }, [navigation, onClose])

  const renderTeam = useCallback(({ item }: { item: Team }) => {
    const isSelected = item.id === selectedTeamId
    return (
      <TouchableOpacity
        style={[styles.teamRow, isSelected && styles.teamRowSelected]}
        onPress={() => onSelect(item.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.name}
        accessibilityState={{ selected: isSelected }}
        accessibilityHint="Tap to select this team"
        testID={`team-row-${item.id}`}
      >
        <Text
          style={[styles.teamRowText, isSelected && styles.teamRowTextSelected]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    )
  }, [onSelect, selectedTeamId])

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={styles.modalOverlay}
        accessibilityViewIsModal={true}
        testID="team-picker-sheet"
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessible={true}
          accessibilityLabel="Dismiss team selector"
          accessibilityRole="button"
          testID="team-picker-backdrop"
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Team</Text>
            <TouchableOpacity
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Close team selector"
              accessibilityRole="button"
            >
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {teams.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Create a team first</Text>
              <Text style={styles.emptyText}>
                You need at least one team before creating a practice.
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateTeam}
                accessible={true}
                accessibilityLabel="Create a team"
                accessibilityRole="button"
              >
                <Text style={styles.createButtonText}>Create a team</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={sortedTeams}
              keyExtractor={team => team.id}
              renderItem={renderTeam}
              style={styles.list}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  checkmark: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.TITLE,
    fontWeight: 'bold',
    marginLeft: SPACING.SM,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.MD,
    justifyContent: 'center',
    marginTop: SPACING.LG,
    minHeight: 44,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  createButtonText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.XL,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.BODY,
    textAlign: 'center',
  },
  emptyTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.SUBTITLE,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  list: {
    flexGrow: 0,
  },
  modalOverlay: {
    backgroundColor: PALETTE.OVERLAY,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopLeftRadius: SPACING.LG,
    borderTopRightRadius: SPACING.LG,
    maxHeight: '60%',
  },
  sheetClose: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TITLE,
    padding: SPACING.SM,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  sheetTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.HEADLINE,
    fontWeight: 'bold',
  },
  teamRow: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  teamRowSelected: {
    backgroundColor: COLORS.BACKGROUND,
  },
  teamRowText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: FONT_SIZES.BODY,
  },
  teamRowTextSelected: {
    fontWeight: '600',
  },
})

export default TeamPickerSheet