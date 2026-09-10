import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppContext } from '../../context/AppContext'
import { Team, TeamFormData } from '../../types'
import { generateTeamId } from '../../utils/teamManagement'
import { TeamForm } from '../forms/TeamForm'
import { SwipeableRow } from '../common/SwipeableRow'
import { Fab } from '../common/Fab'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PALETTE } from '../../utils/outdoorColors'

const TeamView = () => {
  const { state, dispatch } = useAppContext()
  const [formVisible, setFormVisible] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const allTeams = state.data.data.teams
  const allPractices = state.data.data.practices
  const existingTeamNames = allTeams.map(team => team.name)

  const handleAddTeam = () => {
    setEditingTeam(null)
    setFormVisible(true)
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setFormVisible(true)
  }

  const handleSubmitTeam = (values: TeamFormData) => {
    try {
      if (editingTeam) {
        dispatch({
          type: 'UPDATE_TEAM',
          payload: {
            ...editingTeam,
            name: values.name,
            color: values.color,
            updatedAt: new Date().toISOString(),
          },
        })
      } else {
        const newTeam: Team = {
          id: generateTeamId(),
          name: values.name,
          color: values.color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        dispatch({ type: 'ADD_TEAM', payload: newTeam })
      }
      setFormVisible(false)
    } catch (err) {
      console.error('Error saving team:', err)
      Alert.alert('Error', 'Unable to save team. Please try again.')
    }
  }

  const handleDeleteTeam = (team: Team) => {
    const hasPractices = allPractices.some(practice => practice.teamId === team.id)
    if (hasPractices) {
      Alert.alert('Cannot delete team', 'This team has associated practices. Remove them first.')
      return
    }

    Alert.alert('Delete team', `Are you sure you want to delete ${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_TEAM', payload: team.id }),
      },
    ])
  }

  const handleTeamPress = (team: Team) => {
    handleEditTeam(team)
  }

  const renderTeamCard = ({ item }: { item: Team }) => {
    return (
      <SwipeableRow
        onDelete={() => handleDeleteTeam(item)}
        deleteLabel={`Delete ${item.name}`}
        testID={`team-${item.id}`}
      >
        <TouchableOpacity
          style={styles.teamCard}
          onPress={() => handleTeamPress(item)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Team ${item.name}`}
        >
          <View style={styles.teamHeader}>
            <View style={styles.teamInfo}>
              <View style={styles.teamColorContainer}>
                <View style={[styles.teamColor, { backgroundColor: item.color }]} />
              </View>
              <View style={styles.teamDetails}>
                <Text style={styles.teamName}>{item.name}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={PALETTE.NEUTRAL_400} />
      <Text style={styles.emptyText}>No teams yet</Text>
      <Text style={styles.emptySubText}>Create teams to organize your practices</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Teams</Text>
        </View>

      {/* Teams List */}
      <FlatList
        data={allTeams}
        renderItem={renderTeamCard}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <Fab
        onPress={handleAddTeam}
        accessibilityLabel="Add new team"
        testID="fab-add-team"
      />

      <Modal
        visible={formVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFormVisible(false)}
      >
        <TeamForm
          initialValues={
            editingTeam ? { name: editingTeam.name, color: editingTeam.color } : undefined
          }
          existingTeamNames={existingTeamNames}
          onSubmit={handleSubmitTeam}
          onCancel={() => setFormVisible(false)}
          submitLabel={editingTeam ? 'Update Team' : 'Save Team'}
        />
      </Modal>
    </View>
    </SafeAreaView>
  )
}

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
  emptySubText: {
    color: PALETTE.NEUTRAL_400,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    color: PALETTE.TEXT_SECONDARY,
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
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
  safeArea: {
    backgroundColor: PALETTE.GRAY_50,
    flex: 1,
  },
  teamCard: {
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
  teamColor: {
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    width: 24,
  },
  teamColorContainer: {
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teamInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  teamName: {
    color: PALETTE.TEXT_DEFAULT,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
})

export default TeamView
