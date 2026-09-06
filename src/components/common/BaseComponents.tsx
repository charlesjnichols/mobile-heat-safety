import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator, FlatList, TextInput, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
      },
      secondary: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
      },
      danger: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
      },
      success: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
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
    { color: variant === 'secondary' ? '#374151' : '#ffffff' },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={disabled ? 'Button is disabled' : undefined}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={getSizeStyles().fontSize - 4}
              color={variant === 'secondary' ? '#374151' : '#ffffff'}
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
          placeholderTextColor="#9ca3af"
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
            color="#ef4444"
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
  color = '#3b82f6',
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
      <Ionicons name="file-tray-outline" size={48} color="#9ca3af" />
      <Text style={styles.emptyListText}>{message}</Text>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 88, // Minimum touch target size
    height: 44,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  baseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  baseInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    color: '#374151',
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  emptyList: {
    alignItems: 'center',
    padding: 40,
  },
  emptyListText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  errorIcon: {
    position: 'absolute',
    right: 12,
  },
  errorInput: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
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
