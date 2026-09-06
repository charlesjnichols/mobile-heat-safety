import React, { useState, useEffect } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';

// Import types and utilities
import { Checklist, Practice } from '../../types';
import { calculateHeatIndex, getRiskLevel, getHeatIndexColor } from '../../utils/heatIndex';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { HeatIndexIndicator } from '../common/HeatIndexIndicator';
import { APP_CONSTANTS } from '../../types';
import TimePickerSheet from './TimePickerSheet';
import { formatTime12 } from '../../utils/dateTime';

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS;

type ActionTaken = (typeof APP_CONSTANTS.ACTION_TAKEN_OPTIONS)[number];

interface ChecklistFormProps {
  route?: { params?: { practiceId?: string; checklistId?: string; isEdit?: boolean } };
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({ route }) => {
  const navigationInstance = useNavigation();
  const { state, dispatch } = useAppContext();
  const { practiceId, checklistId, isEdit } = route?.params || {};

  const practice = practiceId
    ? state.data.data.practices.find((p: Practice) => p.id === practiceId) ?? null
    : null;
  const loading = state.loading;
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showActionModal, setShowActionModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    time: string;
    temperature: string;
    humidity: string;
    actionTaken: ActionTaken;
    heatIndex: number;
  }>({
    time: '14:30', // HH:MM format
    temperature: '',
    humidity: '',
    actionTaken: APP_CONSTANTS.ACTION_TAKEN_OPTIONS[0], // Default to first option
    heatIndex: 0,
  });

  // Seed the note/entry form state from the shared-state practice once it
  // resolves. The practice itself is read directly from context.
  useEffect(() => {
    if (!practice) {
      return;
    }

    // If editing, load the existing checklist; otherwise default the time.
    if (isEdit && checklistId) {
      const existingChecklist = practice.checklists.find((c: Checklist) => c.id === checklistId);
      if (existingChecklist) {
        setFormData({
          time: existingChecklist.time,
          temperature: existingChecklist.temperature.toString(),
          humidity: existingChecklist.humidity.toString(),
          actionTaken: existingChecklist.actionTaken,
          heatIndex: existingChecklist.heatIndex,
        });
      }
    } else {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, time: timeString }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId, checklistId, isEdit, practice?.id]);

  // Calculate heat index in real-time (only when both inputs are within valid range)
  useEffect(() => {
    const temp = parseFloat(formData.temperature);
    const humidity = parseFloat(formData.humidity);
    const tempValid = !isNaN(temp) && temp >= 60 && temp <= 130;
    const humidityValid = !isNaN(humidity) && humidity >= 0 && humidity <= 100;

    if (tempValid && humidityValid) {
      const heatIndex = calculateHeatIndex(temp, humidity);
      setFormData(prev => ({ ...prev, heatIndex }));
    }
  }, [formData.temperature, formData.humidity]);

  // Handle time selection
  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  const handleTimeChange = (time: string) => {
    setFormData({ ...formData, time });
    setShowTimePicker(false);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }

    // Real-time validation for temperature and humidity
    if (field === 'temperature' || field === 'humidity') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (field === 'temperature' && (numValue < 60 || numValue > 130)) {
          setErrors({
            ...errors,
            [field]: numValue < 60 ? 'Temperature must be at least 60°F' : 'Temperature must be at most 130°F'
          });
        } else if (field === 'humidity' && (numValue < 0 || numValue > 100)) {
          setErrors({
            ...errors,
            [field]: numValue < 0 ? 'Humidity must be at least 0%' : 'Humidity must be at most 100%'
          });
        }
      }
    }
  };

  // Handle action taken selection
  const handleActionSelect = (action: ActionTaken) => {
    setFormData({ ...formData, actionTaken: action });
    setShowActionModal(false);
    HapticFeedback.light();
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate time
    if (!formData.time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      newErrors.time = 'Invalid time format (HH:MM)';
    }
    
    // Validate temperature
    const temp = parseFloat(formData.temperature);
    if (isNaN(temp)) {
      newErrors.temperature = 'Temperature is required';
    } else if (temp < 60 || temp > 130) {
      newErrors.temperature = 'Temperature must be between 60-130°F';
    }
    
    // Validate humidity
    const humidity = parseFloat(formData.humidity);
    if (isNaN(humidity)) {
      newErrors.humidity = 'Humidity is required';
    } else if (humidity < 0 || humidity > 100) {
      newErrors.humidity = 'Humidity must be between 0-100%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save checklist
  const saveChecklist = async () => {
    console.log('[ChecklistForm.saveChecklist] called. practiceId=', practiceId, 'checklistId=', checklistId, 'isEdit=', isEdit, 'practice=', practice ? practice.id : null, 'formData=', JSON.stringify(formData));

    const formValid = validateForm();
    console.log('[ChecklistForm.saveChecklist] validateForm=', formValid, 'errors=', JSON.stringify(errors), 'practiceLoaded=', !!practice);

    if (!formValid || !practice) {
      HapticFeedback.error();
      return;
    }

    try {
      setSaving(true);

      // Prepare checklist data
      const checklistData: Checklist = {
        id: checklistId || `checklist-${Date.now()}`,
        practiceId: practice.id,
        time: formData.time,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        heatIndex: formData.heatIndex,
        actionTaken: formData.actionTaken,
        timestamp: new Date().toISOString(),
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
      };

      // Update shared state so practice detail/list reflect the change immediately;
      // the provider's auto-save persists the change.
      if (isEdit && checklistId) {
        dispatch({ type: 'UPDATE_CHECKLIST', payload: { practiceId: practice.id, checklist: checklistData } });
      } else {
        dispatch({ type: 'ADD_CHECKLIST', payload: { practiceId: practice.id, checklist: checklistData } });
      }

      HapticFeedback.success();
      navigationInstance.goBack();
    } catch (err) {
      console.error('[ChecklistForm.saveChecklist] ERROR:', err);
      Alert.alert('Error', 'Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  // Get risk level for current heat index
  const riskLevel = getRiskLevel(formData.heatIndex);
  const riskColor = getHeatIndexColor(formData.heatIndex);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading form data...</Text>
      </View>
    );
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
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Checklist' : 'Add Checklist Entry'}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Time Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Time *</Text>
            <TouchableOpacity
              style={[styles.input, errors.time ? styles.inputError : undefined]}
              onPress={openTimePicker}
              accessible={true}
              accessibilityLabel="Time picker"
              accessibilityHint="Tap to select time"
            >
              <Text style={styles.inputText}>{formatTime12(formData.time)}</Text>
              <Text style={styles.inputHint}>Tap to change</Text>
            </TouchableOpacity>
            {errors.time && (
              <Text style={styles.errorText}>{errors.time}</Text>
            )}
          </View>

          {/* Temperature Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Temperature (°F) *</Text>
            <View style={[styles.inputContainer, errors.temperature ? styles.inputError : undefined]}>
              <TextInput
                style={styles.input}
                value={formData.temperature}
                onChangeText={(value) => handleInputChange('temperature', value)}
                placeholder="Enter temperature (60-130°F)"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
                accessible={true}
                accessibilityLabel="Temperature input"
                accessibilityHint="Enter temperature in Fahrenheit"
              />
            </View>
            {errors.temperature && (
              <Text style={styles.errorText}>{errors.temperature}</Text>
            )}
          </View>

          {/* Humidity Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Humidity (%) *</Text>
            <View style={[styles.inputContainer, errors.humidity ? styles.inputError : undefined]}>
              <TextInput
                style={styles.input}
                value={formData.humidity}
                onChangeText={(value) => handleInputChange('humidity', value)}
                placeholder="Enter humidity (0-100%)"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="numeric"
                accessible={true}
                accessibilityLabel="Humidity input"
                accessibilityHint="Enter humidity percentage"
              />
            </View>
            {errors.humidity && (
              <Text style={styles.errorText}>{errors.humidity}</Text>
            )}
          </View>

          {/* Real-time Heat Index */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Heat Index (Calculated)</Text>
            <View style={styles.heatIndexContainer}>
              <HeatIndexIndicator
                value={formData.heatIndex}
                size="medium"
              />
              <View style={styles.heatIndexInfo}>
                <Text style={[styles.riskLevel, { color: riskColor }]}>
                  {riskLevel} Risk
                </Text>
              </View>
            </View>
          </View>

          {/* Action Taken Field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Action Taken *</Text>
            <TouchableOpacity
              style={[styles.actionSelector, errors.actionTaken ? styles.inputError : undefined]}
              onPress={() => setShowActionModal(true)}
              accessible={true}
              accessibilityLabel="Action taken selector"
              accessibilityHint="Tap to select action taken during practice"
            >
              <Text style={styles.actionSelectorText}>
                {formData.actionTaken}
              </Text>
              <Text style={styles.actionSelectorHint}>Tap to change</Text>
            </TouchableOpacity>
            {errors.actionTaken && (
              <Text style={styles.errorText}>{errors.actionTaken}</Text>
            )}
          </View>

          {/* Action Selection Modal */}
          <Modal
            visible={showActionModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowActionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Action Taken</Text>
                  <TouchableOpacity onPress={() => setShowActionModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalOptions}>
                  {APP_CONSTANTS.ACTION_TAKEN_OPTIONS.map((action) => (
                    <TouchableOpacity
                      key={action}
                      style={styles.modalOption}
                      onPress={() => handleActionSelect(action)}
                    >
                      <Text style={styles.modalOptionText}>{action}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveChecklist}
              disabled={saving}
              accessible={true}
              accessibilityLabel="Save checklist button"
              accessibilityHint="Tap to save checklist entry"
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.CARD_BACKGROUND} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEdit ? 'Update Entry' : 'Add Entry'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <TimePickerSheet
        visible={showTimePicker}
        initialTime={formData.time}
        onConfirm={handleTimeChange}
        onClose={() => setShowTimePicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  actionSelector: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderColor: COLORS.BORDER,
    borderRadius: SPACING.SM,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    padding: SPACING.MD,
  },
  actionSelectorHint: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.CAPTION,
    fontStyle: 'italic',
  },
  actionSelectorText: {
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    fontSize: FONT_SIZES.BODY,
  },
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
  heatIndexContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderColor: COLORS.BORDER,
    borderRadius: SPACING.SM,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 80,
    padding: SPACING.MD,
  },
  heatIndexInfo: {
    flex: 1,
    marginLeft: SPACING.MD,
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
  modalClose: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TITLE,
    padding: SPACING.SM,
  },
  modalContent: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopLeftRadius: SPACING.LG,
    borderTopRightRadius: SPACING.LG,
    maxHeight: '50%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.LG,
  },
  modalOption: {
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    padding: SPACING.MD,
  },
  modalOptionText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
  },
  modalOptions: {
    maxHeight: '60%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.HEADLINE,
    fontWeight: 'bold',
  },
  riskLevel: {
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
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
});

export default ChecklistForm;