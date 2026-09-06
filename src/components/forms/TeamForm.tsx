import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TeamFormData } from '../../types'
import { TeamFormSchema } from '../../utils/validation'
import { HapticFeedback } from '../../utils/hapticFeedback'

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
    HapticFeedback.light()
    if (validate()) {
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
        placeholderTextColor="#9ca3af"
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
              accessibilityLabel={`Select color ${option}`}
              accessibilityState={{ selected }}
              testID={`color-option-${option}`}
            >
              {selected ? <Ionicons name="checkmark" size={20} color="#ffffff" /> : null}
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
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#374151',
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
    borderColor: 'transparent',
    borderRadius: 22,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
    marginRight: 8,
    width: 44,
  },
  colorSwatchSelected: {
    borderColor: '#111827',
  },
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  preview: {
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center',
    padding: 12,
  },
  previewText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
})

export default TeamForm
export { TeamForm }
export type { TeamFormProps }
