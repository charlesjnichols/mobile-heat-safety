import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator, FlatList, TextInput, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE } from '../../utils/outdoorColors';

// Centralized color constants for the base component set.
const COLORS = {
  primary: PALETTE.BLUE_500,
  primaryBorder: PALETTE.BLUE_500,
  secondaryBg: PALETTE.NEUTRAL_100,
  secondaryBorder: PALETTE.NEUTRAL_300,
  secondaryText: PALETTE.NEUTRAL_700,
  danger: PALETTE.RED_500,
  dangerBorder: PALETTE.RED_500,
  success: PALETTE.EMERALD_500,
  successBorder: PALETTE.EMERALD_500,
  white: PALETTE.WHITE,
  disabledBg: PALETTE.NEUTRAL_100,
  disabledBorder: PALETTE.NEUTRAL_300,
  text: PALETTE.NEUTRAL_700,
  inputBg: PALETTE.WHITE,
  inputBorder: PALETTE.NEUTRAL_300,
  disabledInputBg: PALETTE.NEUTRAL_50,
  disabledInputText: PALETTE.NEUTRAL_400,
  label: PALETTE.NEUTRAL_700,
  cardBg: PALETTE.WHITE,
  cardTitle: PALETTE.NEUTRAL_800,
  placeholder: PALETTE.NEUTRAL_400,
  emptyText: PALETTE.NEUTRAL_500,
  emptyIcon: PALETTE.NEUTRAL_400,
} as const;

// Base mobile component with accessibility support

interface BaseButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const BaseButton: React.FC<BaseButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
  testID,
}) => {
  const getVariantStyles = () => {
    const baseStyles = {
      primary: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primaryBorder,
      },
      secondary: {
        backgroundColor: COLORS.secondaryBg,
        borderColor: COLORS.secondaryBorder,
      },
      danger: {
        backgroundColor: COLORS.danger,
        borderColor: COLORS.dangerBorder,
      },
      success: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.successBorder,
      },
    };

    return baseStyles[variant];
  };

  const getSizeStyles = () => {
    const baseStyles = {
      small: {
        height: 36,
        paddingHorizontal: 16,
        fontSize: 14,
      },
      medium: {
        height: 44,
        paddingHorizontal: 20,
        fontSize: 16,
      },
      large: {
        height: 52,
        paddingHorizontal: 24,
        fontSize: 18,
      },
    };

    return baseStyles[size];
  };

  const buttonStyles = [
    styles.baseButton,
    getVariantStyles(),
    getSizeStyles(),
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    { color: variant === 'secondary' ? COLORS.secondaryText : COLORS.white },
    textStyle,
  ];

  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityHint={disabled ? 'Button is disabled' : undefined}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? COLORS.secondaryText : COLORS.white} size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={getSizeStyles().fontSize - 4}
              color={isSecondary ? COLORS.secondaryText : COLORS.white}
              style={styles.buttonIcon}
            />
          )}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

interface BaseInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
}

export const BaseInput: React.FC<BaseInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  testID,
}) => {
  const inputStyles = [
    styles.baseInput,
    multiline ? styles.multilineInput : undefined,
    error ? styles.errorInput : undefined,
    error ? styles.inputWithErrorIcon : undefined,
    disabled ? styles.disabledInput : undefined,
    inputStyle,
  ];

  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <Text style={styles.inputLabel}>
          {label}
          {error && <Text style={styles.errorText}> *</Text>}
        </Text>
      )}
      <View style={styles.inputWrapper}>
        <TextInput
          style={inputStyles}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          accessibilityLabel={label || placeholder}
          accessibilityHint={error ? 'Input has an error' : undefined}
          testID={testID}
        />
        {error && (
          <Ionicons
            name="alert-circle"
            size={20}
            color={COLORS.danger}
            style={styles.errorIcon}
          />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

interface BaseCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  children,
  style,
  testID,
}) => {
  return (
    <View style={[styles.baseCard, style]} testID={testID}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      {children}
    </View>
  );
};

interface BaseListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  style?: ViewStyle;
  testID?: string;
}

export const BaseList = <T,>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  style,
  testID,
}: BaseListProps<T>) => {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent || <EmptyList />}
      style={[styles.baseList, style]}
      testID={testID}
    />
  );
};

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = COLORS.primary,
  testID,
}) => {
  const sizeMap = {
    small: 20,
    medium: 30,
    large: 40,
  };

  return (
    <View style={styles.loadingContainer} testID={testID}>
      <ActivityIndicator size={sizeMap[size]} color={color} />
    </View>
  );
};

interface EmptyListProps {
  message?: string;
  testID?: string;
}

export const EmptyList: React.FC<EmptyListProps> = ({
  message = 'No data available',
  testID,
}) => {
  return (
    <View style={styles.emptyList} testID={testID}>
      <Ionicons name="file-tray-outline" size={48} color={COLORS.emptyIcon} />
      <Text style={styles.emptyListText}>{message}</Text>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    minWidth: 88, // Minimum touch target size
    paddingHorizontal: 20,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  baseCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    elevation: 2,
    marginVertical: 8,
    padding: 16,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  baseInput: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    height: 44,
    paddingHorizontal: 16,
  },
  baseList: {
    flex: 1,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardTitle: {
    color: COLORS.cardTitle,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: COLORS.disabledBg,
    borderColor: COLORS.disabledBorder,
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: COLORS.disabledInputBg,
    color: COLORS.disabledInputText,
  },
  emptyList: {
    alignItems: 'center',
    padding: 40,
  },
  emptyListText: {
    color: COLORS.emptyText,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  errorIcon: {
    position: 'absolute',
    right: 12,
  },
  errorInput: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.label,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputWithErrorIcon: {
    paddingRight: 40,
  },
  inputWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  multilineInput: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
});
