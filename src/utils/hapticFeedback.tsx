import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Lazily load expo-haptics to avoid issues on web/unsupported platforms
type HapticsModule = typeof import('expo-haptics');
let hapticsModule: HapticsModule | null = null;

const getHaptics = (): HapticsModule | null => {
  if (hapticsModule) return hapticsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    hapticsModule = require('expo-haptics') as HapticsModule;
    return hapticsModule;
  } catch {
    return null;
  }
};

const triggerImpact = (style: 'Light' | 'Medium' | 'Heavy'): void => {
  try {
    const haptics = getHaptics();
    if (haptics) {
      haptics.impactAsync(haptics.ImpactFeedbackStyle[style]);
    }
  } catch {
    console.log('Haptic feedback not available');
  }
};

const triggerNotification = (type: 'Success' | 'Warning' | 'Error'): void => {
  try {
    const haptics = getHaptics();
    if (haptics) {
      haptics.notificationAsync(haptics.NotificationFeedbackType[type]);
    }
  } catch {
    console.log('Haptic feedback not available');
  }
};

// Haptic feedback utility
export const HapticFeedback = {
  /**
   * Light impact for subtle feedback
   */
  light: (): void => triggerImpact('Light'),

  /**
   * Medium impact for moderate feedback
   */
  medium: (): void => triggerImpact('Medium'),

  /**
   * Heavy impact for strong feedback
   */
  heavy: (): void => triggerImpact('Heavy'),

  /**
   * Success notification
   */
  success: (): void => triggerNotification('Success'),

  /**
   * Warning notification
   */
  warning: (): void => triggerNotification('Warning'),

  /**
   * Error notification
   */
  error: (): void => triggerNotification('Error'),

  /**
   * Selection feedback for list items
   */
  selection: (): void => {
    try {
      const haptics = getHaptics();
      if (haptics) {
        haptics.selectionAsync();
      }
    } catch {
      console.log('Haptic feedback not available');
    }
  },
};

// Haptic feedback types
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Interface for haptic button props
interface HapticButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  hapticType?: HapticType;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  activeOpacity?: number;
}

// Haptic button component
export const HapticButton: React.FC<HapticButtonProps> = ({
  children,
  onPress,
  hapticType = 'light',
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
  testID,
  activeOpacity = 0.7,
}) => {
  const handlePress = () => {
    if (!disabled) {
      // Trigger haptic feedback
      switch (hapticType) {
        case 'light':
          HapticFeedback.light();
          break;
        case 'medium':
          HapticFeedback.medium();
          break;
        case 'heavy':
          HapticFeedback.heavy();
          break;
        case 'success':
          HapticFeedback.success();
          break;
        case 'warning':
          HapticFeedback.warning();
          break;
        case 'error':
          HapticFeedback.error();
          break;
        case 'selection':
          HapticFeedback.selection();
          break;
      }
      
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      activeOpacity={activeOpacity}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, textStyle, disabled && styles.textDisabled]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Haptic icon button component
interface HapticIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  onPress: () => void;
  hapticType?: HapticType;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  backgroundColor?: string;
}

export const HapticIconButton: React.FC<HapticIconButtonProps> = ({
  icon,
  size = 24,
  color = '#ffffff',
  onPress,
  hapticType = 'light',
  style,
  disabled = false,
  accessibilityLabel,
  testID,
  backgroundColor = '#3b82f6',
}) => {
  const handlePress = () => {
    if (!disabled) {
      // Trigger haptic feedback
      switch (hapticType) {
        case 'light':
          HapticFeedback.light();
          break;
        case 'medium':
          HapticFeedback.medium();
          break;
        case 'heavy':
          HapticFeedback.heavy();
          break;
        case 'success':
          HapticFeedback.success();
          break;
        case 'warning':
          HapticFeedback.warning();
          break;
        case 'error':
          HapticFeedback.error();
          break;
        case 'selection':
          HapticFeedback.selection();
          break;
      }
      
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        style,
        disabled && styles.iconButtonDisabled,
        { backgroundColor },
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
};

// Haptic touchable component for any view
interface HapticTouchableProps {
  children: React.ReactNode;
  onPress: () => void;
  hapticType?: HapticType;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  activeOpacity?: number;
}

export const HapticTouchable: React.FC<HapticTouchableProps> = ({
  children,
  onPress,
  hapticType = 'light',
  style,
  disabled = false,
  accessibilityLabel,
  testID,
  activeOpacity = 0.7,
}) => {
  const handlePress = () => {
    if (!disabled) {
      // Trigger haptic feedback
      switch (hapticType) {
        case 'light':
          HapticFeedback.light();
          break;
        case 'medium':
          HapticFeedback.medium();
          break;
        case 'heavy':
          HapticFeedback.heavy();
          break;
        case 'success':
          HapticFeedback.success();
          break;
        case 'warning':
          HapticFeedback.warning();
          break;
        case 'error':
          HapticFeedback.error();
          break;
        case 'selection':
          HapticFeedback.selection();
          break;
      }
      
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[style, disabled && styles.touchableDisabled]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      activeOpacity={activeOpacity}
    >
      {children}
    </TouchableOpacity>
  );
};

// Hook for haptic feedback
export const useHapticFeedback = (type: HapticType = 'light') => {
  const triggerHaptic = React.useCallback(() => {
    switch (type) {
      case 'light':
        HapticFeedback.light();
        break;
      case 'medium':
        HapticFeedback.medium();
        break;
      case 'heavy':
        HapticFeedback.heavy();
        break;
      case 'success':
        HapticFeedback.success();
        break;
      case 'warning':
        HapticFeedback.warning();
        break;
      case 'error':
        HapticFeedback.error();
        break;
      case 'selection':
        HapticFeedback.selection();
        break;
    }
  }, [type]);

  return triggerHaptic;
};

// Custom hook for haptic selection feedback
export const useHapticSelection = () => {
  return useHapticFeedback('selection');
};

// Custom hook for haptic success feedback
export const useHapticSuccess = () => {
  return useHapticFeedback('success');
};

// Custom hook for haptic error feedback
export const useHapticError = () => {
  return useHapticFeedback('error');
};

// Haptic feedback provider for global configuration
interface HapticProviderProps {
  children: React.ReactNode;
  defaultType?: HapticType;
  enabled?: boolean;
}

export const HapticProvider: React.FC<HapticProviderProps> = ({
  children,
  defaultType = 'light',
  enabled = true,
}) => {
  // Global haptic context could be added here if needed
  return <>{children}</>;
};

// Style definitions
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    elevation: 2,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    elevation: 2,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 44,
  },
  iconButtonDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: '#ffffff',
    opacity: 0.8,
  },
  touchableDisabled: {
    opacity: 0.6,
  },
});