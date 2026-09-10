import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TeamFormData } from '../../types'
import { TeamFormSchema } from '../../utils/validation'
import { HapticFeedback } from '../../utils/hapticFeedback'
import { PALETTE } from '../../utils/outdoorColors'

const TEAM_COLOR_OPTIONS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
] as const

// Human-readable color names for accessibility (screen readers).
const COLOR_NAMES: Record<string, string> = {
  '#FF6B6B': 'Coral Red',
  '#4ECDC4': 'Teal',
  '#45B7D1': 'Sky Blue',
  '#96CEB4': 'Sage Green',
  '#FFEAA7': 'Lemon Yellow',
  '#DDA0DD': 'Lavender',
  '#98D8C8': 'Mint',
  '#F7DC6F': 'Golden Yellow',
}

const colorName = (hex: string): string => COLOR_NAMES[hex] ?? hex

interface TeamFormProps {
  initialValues?: Partial<TeamFormData>
  existingTeamNames: string[]
  onSubmit: (values: TeamFormData) => void
  onCancel: () => void
  submitLabel?: string
  testID?: string
}

const TeamForm: React.FC<TeamFormProps> = ({
  initialValues,
  existingTeamNames,
  onSubmit,
  onCancel,
  submitLabel = 'Save Team',
  testID,
}) => {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [color, setColor] = useState(initialValues?.color ?? TEAM_COLOR_OPTIONS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}

    const parsed = TeamFormSchema.safeParse({ name, color })
    if (!parsed.success) {
      parsed.error.issues.forEach(issue => {
        const key = issue.path.join('.') || 'name'
        nextErrors[key] = issue.message
      })
    } else {
      const trimmed = name.trim().toLowerCase()
      const isDuplicate = existingTeamNames.some(
        existing =>
          existing.trim().toLowerCase() === trimmed &&
          existing.trim().toLowerCase() !== (initialValues?.name ?? '').trim().toLowerCase()
      )
      if (isDuplicate) {
        nextErrors.name = 'Team name must be unique'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      HapticFeedback.light()
      onSubmit({ name: name.trim(), color })
    } else {
      HapticFeedback.error()
    }
  }

  return (
    <ScrollView style={styles.container} testID={testID}>
      <Text style={styles.title}>{initialValues?.name ? 'Edit Team' : 'Add New Team'}</Text>

      <Text style={styles.label}>Team Name</Text>
      <TextInput
        style={[styles.input, errors.name ? styles.inputError : null]}
        value={name}
        onChangeText={setName}
        placeholder="Enter team name"
        placeholderTextColor={PALETTE.TEXT_MUTED}
        accessibilityLabel="Team name input"
        accessibilityHint="Enter a unique team name"
        testID="team-name-input"
      />
      {errors.name ? (
        <Text style={styles.errorText} accessibilityLabel={errors.name}>
          {errors.name}
        </Text>
      ) : null}

      <Text style={styles.label}>Team Color</Text>
      <View style={styles.colorRow}>
        {TEAM_COLOR_OPTIONS.map(option => {
          const selected = option === color
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.colorSwatch,
                { backgroundColor: option },
                selected ? styles.colorSwatchSelected : null,
              ]}
              onPress={() => {
                HapticFeedback.selection()
                setColor(option)
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Select color ${colorName(option)}`}
              accessibilityState={{ selected }}
              testID={`color-option-${option}`}
            >
              {selected ? <Ionicons name="checkmark" size={20} color={PALETTE.WHITE} /> : null}
            </TouchableOpacity>
          )
        })}
      </View>
      <View
        style={[styles.preview, { backgroundColor: color }]}
        accessibilityLabel={`Team color preview ${color}`}
      >
        <Text style={styles.previewText}>{name || 'Team preview'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          accessibilityLabel="Cancel team form"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          accessibilityLabel={submitLabel}
        >
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: PALETTE.NEUTRAL_100,
    marginRight: 8,
  },
  cancelButtonText: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 16,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  colorSwatch: {
    alignItems: 'center',
    borderColor: PALETTE.TRANSPARENT,
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
    marginRight: 8,
    width: 44,
  },
  colorSwatchSelected: {
    borderColor: PALETTE.TEXT_DARK,
  },
  container: {
    backgroundColor: PALETTE.WHITE,
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: PALETTE.RED_600,
    fontSize: 13,
    marginTop: 4,
  },
  input: {
    backgroundColor: PALETTE.NEUTRAL_50,
    borderColor: PALETTE.NEUTRAL_200,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: PALETTE.RED_600,
  },
  label: {
    color: PALETTE.TEXT_STRONG,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  preview: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
    padding: 12,
  },
  previewText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: PALETTE.BLUE_500,
    marginLeft: 8,
  },
  submitButtonText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: PALETTE.TEXT_DARK,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
})

export default TeamForm
export { TeamForm }
export type { TeamFormProps }
