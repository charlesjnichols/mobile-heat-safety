import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { z } from 'zod'
import { useAppContext } from '../../context/AppContext'
import { generateId } from '../../utils/teamManagement'

// Import types and utilities
import { Practice } from '../../types'
import { HapticFeedback } from '../../utils/hapticFeedback'
import { APP_CONSTANTS } from '../../types'
import TeamPickerSheet from './TeamPickerSheet'
import DatePickerSheet from './DatePickerSheet'

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS

const PracticeFieldsSchema = z.object({
  date: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  headCoach: z.string().min(1, 'Required').max(50, 'Coach name must be less than 50 characters'),
  teamId: z.string().min(1, 'Required'),
})

interface PracticeFormProps {
  route?: { params?: { practiceId?: string; teamId?: string } };
}

const PracticeForm: React.FC<PracticeFormProps> = ({ route }) => {
  const navigationInstance = useNavigation()
  const { state, dispatch } = useAppContext()
  const { practiceId, teamId: preselectedTeamId } = route?.params || {}

  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTeamPicker, setShowTeamPicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    location: '',
    headCoach: '',
    teamId: preselectedTeamId || '',
  })

  // Derive teams and (when editing) the existing practice from shared state.
  // Local form state is initialized once from context on first render.
  const teams = state.data.data.teams
  const loading = state.loading

  const editingPractice = practiceId
    ? state.data.data.practices.find((p: Practice) => p.id === practiceId)
    : undefined

  useEffect(() => {
    if (editingPractice) {
      setFormData({
        date: editingPractice.date,
        location: editingPractice.location,
        headCoach: editingPractice.headCoach ?? '',
        teamId: editingPractice.teamId,
      })
    }
    // Only seed form state when the target practice first resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId, editingPractice?.id])

  // Handle date selection
  const openDatePicker = () => {
    setShowDatePicker(true)
  }

  const handleDateChange = (date: string) => {
    setFormData({ ...formData, date })
    setShowDatePicker(false)
    handleFieldBlur('date')
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  // Handle field blur (for validation)
  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })

    // Validate only the field that was blurred
    const fieldSchema = PracticeFieldsSchema.pick({ [field]: true } as { [K in keyof typeof PracticeFieldsSchema.shape]?: true })
    const result = fieldSchema.safeParse({ [field]: formData[field as keyof typeof formData] })

    if (!result.success) {
      const fieldError = result.error.errors.find(issue => issue.path[0] === field)
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: fieldError.message }))
      }
    } else {
      setErrors(prev => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const result = PracticeFieldsSchema.safeParse(formData)

    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach(issue => {
        const path = issue.path.join('.')
        newErrors[path] = issue.message
      })
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    setErrors({})
    return true
  }

  // Save practice
  const savePractice = async () => {
    if (!validateForm()) {
      HapticFeedback.error()
      return
    }

    try {
      setSaving(true)

      const existing = practiceId
        ? state.data.data.practices.find((p: Practice) => p.id === practiceId)
        : undefined

      // Prepare practice data
      const practiceData: Practice = {
        id: practiceId || `practice-${generateId()}`,
        name: formData.location || 'Practice',
        date: formData.date,
        location: formData.location,
        coach: formData.headCoach,
        sport: '',
        contactInfo: '',
        headCoach: formData.headCoach,
        teamId: formData.teamId,
        notes: existing?.notes ?? '',
        checklists: existing?.checklists || [],
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update shared state so the practice list reflects the change immediately;
      // the provider's auto-save persists the change.
      if (practiceId) {
        dispatch({ type: 'UPDATE_PRACTICE', payload: practiceData })
      } else {
        dispatch({ type: 'ADD_PRACTICE', payload: practiceData })
      }

      HapticFeedback.success()
      Alert.alert(
        'Success',
        practiceId ? 'Practice updated successfully' : 'Practice created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigationInstance.goBack(),
          },
        ]
      )
    } catch (err) {
      console.error('Error saving practice:', err)
      Alert.alert('Error', 'Failed to save practice')
    } finally {
      setSaving(false)
    }
  }

  // Get selected team
  const selectedTeam = teams.find(team => team.id === formData.teamId)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading form data...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{practiceId ? 'Edit Practice' : 'New Practice'}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Date Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Practice Date *</Text>
            <TouchableOpacity
              style={[styles.input, errors.date ? styles.inputError : undefined]}
              onPress={openDatePicker}
              accessible={true}
              accessibilityLabel="Practice date picker"
              accessibilityHint="Tap to select practice date"
            >
              <Text style={styles.inputText}>{new Date(formData.date).toLocaleDateString()}</Text>
              <Text style={styles.inputHint}>Tap to change</Text>
            </TouchableOpacity>
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Location Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Location *</Text>
            <View style={[styles.inputContainer, errors.location ? styles.inputError : undefined]}>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={value => handleInputChange('location', value)}
                onBlur={() => handleFieldBlur('location')}
                placeholder="Enter practice location"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                accessible={true}
                accessibilityLabel="Practice location input"
                accessibilityHint="Enter the location where practice will take place"
              />
            </View>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Head Coach Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Head Coach *</Text>
            <View style={[styles.inputContainer, errors.headCoach ? styles.inputError : undefined]}>
              <TextInput
                style={styles.input}
                value={formData.headCoach}
                onChangeText={value => handleInputChange('headCoach', value)}
                onBlur={() => handleFieldBlur('headCoach')}
                placeholder="Enter head coach name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                accessible={true}
                accessibilityLabel="Head coach name input"
                accessibilityHint="Enter the name of the head coach"
              />
            </View>
            {errors.headCoach && <Text style={styles.errorText}>{errors.headCoach}</Text>}
          </View>

          {/* Team Selection */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Team *</Text>
            <View style={[styles.inputContainer, errors.teamId ? styles.inputError : undefined]}>
              <TouchableOpacity
                style={styles.teamSelector}
                onPress={() => setShowTeamPicker(true)}
                accessible={true}
                accessibilityLabel="Team selector"
                accessibilityHint="Tap to select a team for this practice"
                testID="team-selector"
              >
                <Text style={styles.teamSelectorText}>
                  {selectedTeam ? selectedTeam.name : 'Select a team...'}
                </Text>
                <Text style={styles.teamSelectorHint}>Tap to change</Text>
              </TouchableOpacity>
            </View>
            {errors.teamId && <Text style={styles.errorText}>{errors.teamId}</Text>}
            {selectedTeam && (
              <View style={[styles.teamBadge, { backgroundColor: selectedTeam.color }]}>
                <Text style={styles.teamName}>{selectedTeam.name}</Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={savePractice}
              disabled={saving}
              accessible={true}
              accessibilityLabel="Save practice button"
              accessibilityHint="Tap to save practice information"
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.CARD_BACKGROUND} />
              ) : (
                <Text style={styles.saveButtonText}>Save Practice</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TeamPickerSheet
        teams={teams}
        selectedTeamId={formData.teamId}
        visible={showTeamPicker}
        onSelect={teamId => {
          handleInputChange('teamId', teamId)
          HapticFeedback.light()
          setShowTeamPicker(false)
        }}
        onClose={() => setShowTeamPicker(false)}
      />

      <DatePickerSheet
        visible={showDatePicker}
        initialDate={formData.date}
        onConfirm={handleDateChange}
        onClose={() => setShowDatePicker(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginBottom: SPACING.XL,
    marginTop: SPACING.LG,
  },
  container: {
    backgroundColor: COLORS.BACKGROUND,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.CAPTION,
    marginLeft: SPACING.SM,
    marginTop: SPACING.XS,
  },
  field: {
    marginBottom: SPACING.LG,
  },
  fieldLabel: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
    marginBottom: SPACING.SM,
    marginLeft: SPACING.SM,
  },
  form: {
    padding: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: SPACING.MD,
  },
  headerTitle: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: FONT_SIZES.HEADLINE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
    minHeight: 44,
    padding: SPACING.MD,
  },
  inputContainer: {
    borderColor: COLORS.BORDER,
    borderRadius: SPACING.SM,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  inputHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.CAPTION,
    fontStyle: 'italic',
    marginTop: 2,
  },
  inputText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.MD,
    elevation: 3,
    justifyContent: 'center',
    padding: SPACING.LG,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  teamBadge: {
    alignSelf: 'flex-start',
    borderRadius: SPACING.SM,
    marginTop: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  teamName: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  teamSelector: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    padding: SPACING.MD,
  },
  teamSelectorHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.CAPTION,
    fontStyle: 'italic',
  },
  teamSelectorText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: FONT_SIZES.BODY,
  },
})

export default PracticeForm
