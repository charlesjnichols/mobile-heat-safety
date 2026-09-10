import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PALETTE } from '../utils/outdoorColors';

// Error severity levels
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success';

// Error message interface
export interface ErrorMessage {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Error handler hook interface
interface ErrorHandler {
  error: ErrorMessage | null;
  handleError: (message: string, severity?: ErrorSeverity, action?: { label: string; onPress: () => void }) => void;
  clearError: () => void;
  dismissError: () => void;
}

// Error severity to haptic feedback mapping
const HAPTIC_FEEDBACK = {
  info: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
  success: Haptics.NotificationFeedbackType.Success,
};

/**
 * Trigger haptic feedback based on error severity
 */
export const triggerHapticFeedback = (severity: ErrorSeverity): void => {
  try {
    void Haptics.notificationAsync(HAPTIC_FEEDBACK[severity]).catch(() => {
      // Ignore haptic failures (unsupported platform, etc.)
    });
  } catch (error) {
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * Custom hook for mobile-optimized error handling with haptic feedback
 */
export const useErrorHandler = (): ErrorHandler => {
  const [error, setError] = React.useState<ErrorMessage | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending auto-dismiss timer on unmount to avoid leaking timers.
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const dismissError = React.useCallback((errorId?: string) => {
    if (errorId) {
      // Dismiss specific error
      setError(prev => prev?.id === errorId ? null : prev);
    } else {
      // Dismiss current error
      setError(null);
    }
  }, []);

  const handleError = React.useCallback((
    message: string,
    severity: ErrorSeverity = 'error',
    action?: { label: string; onPress: () => void }
  ) => {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newError: ErrorMessage = {
      id: errorId,
      message,
      severity,
      timestamp: new Date(),
      action,
    };

    setError(newError);

    // Trigger haptic feedback
    triggerHapticFeedback(severity);

    // Auto-dismiss after 5 seconds if no action provided
    if (!action) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        dismissError(errorId);
      }, 5000);
    }
  }, [dismissError]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    dismissError,
  };
};

/**
 * Validate form input and show error with haptic feedback
 */
export const validateWithFeedback = <T,>(
  value: T,
  validator: (value: T) => boolean | string,
  setError: (message: string) => void
): boolean => {
  const result = validator(value);
  
  if (result === true) {
    return true;
  } else {
    const errorMessage = typeof result === 'string' ? result : 'Invalid input';
    setError(errorMessage);
    triggerHapticFeedback('error');
    return false;
  }
};

/**
 * Network error handler with user-friendly messages
 */
export const handleNetworkError = (error: Error): string => {
  console.error('Network error:', error);
  
  // Check for common network error patterns
  if (error.message.includes('Network request failed')) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  if (error.message.includes('Unable to resolve host')) {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  // Generic error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Storage error handler with user-friendly messages
 */
export const handleStorageError = (error: Error): string => {
  console.error('Storage error:', error);
  
  if (error.message.includes('Failed to save data')) {
    return 'Unable to save data. Please check your device storage and try again.';
  }
  
  if (error.message.includes('Failed to load data')) {
    return 'Unable to load data. Please try again.';
  }
  
  if (error.message.includes('Failed to clear data')) {
    return 'Unable to clear data. Please try again.';
  }
  
  return 'A storage error occurred. Please try again.';
};

/**
 * Validation error handler for forms
 */
export const handleValidationError = (errors: Record<string, string>): string => {
  const firstError = Object.values(errors)[0];
  if (firstError) {
    triggerHapticFeedback('error');
    return firstError;
  }
  return 'Please check your input and try again.';
};

/**
 * Success handler with haptic feedback
 */
export const showSuccess = (message: string, action?: { label: string; onPress: () => void }): void => {
  triggerHapticFeedback('success');
  
  // You could integrate this with a toast/notification system
  console.log('Success:', message);
  
  if (action) {
    console.log('Action available:', action.label);
  }
};

/**
 * Warning handler with haptic feedback
 */
export const showWarning = (message: string, action?: { label: string; onPress: () => void }): void => {
  triggerHapticFeedback('warning');
  
  console.log('Warning:', message);
  
  if (action) {
    console.log('Action available:', action.label);
  }
};

/**
 * Error boundary for React components
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Trigger haptic feedback for critical errors
    triggerHapticFeedback('error');
    
    // Call custom error handler if provided
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong.</Text>
          <Text style={styles.errorDetails}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    backgroundColor: PALETTE.GRAY_SOFT,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorDetails: {
    color: PALETTE.GRAY_MID,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  errorText: {
    color: PALETTE.RED_BOOTSTRAP,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  retryButton: {
    backgroundColor: PALETTE.BLUE_600,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '500',
  },
});