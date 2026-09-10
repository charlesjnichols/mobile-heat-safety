import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { ColorCode, getRiskLevel, getRiskColor, getRecommendedAction, RiskLevel } from './ColorCode';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { PALETTE } from '../../utils/outdoorColors';

interface SafetyAlertProps {
  heatIndex: number;
  autoAlert?: boolean;
  alertThreshold?: number;
  onRiskChange?: (oldRisk: RiskLevel, newRisk: RiskLevel) => void;
  testID?: string;
}

/**
 * SafetyAlert Component
 *
 * Monitors heat index levels and provides automatic safety alerts
 * for high-risk conditions. Uses haptic feedback and notifications
 * to ensure immediate awareness of safety concerns.
 *
 * @param heatIndex - Current heat index value
 * @param autoAlert - Automatically alert when heat index exceeds threshold
 * @param alertThreshold - Heat index threshold for triggering alerts
 * @param onRiskChange - Callback when risk level changes
 * @param testID - Testing identifier
 */
export const SafetyAlert: React.FC<SafetyAlertProps> = ({
  heatIndex,
  autoAlert = true,
  alertThreshold = 80,
  onRiskChange,
  testID
}) => {
  const [previousRisk, setPreviousRisk] = React.useState<RiskLevel | null>(null);
  const [alertedRisk, setAlertedRisk] = React.useState<RiskLevel | null>(null);

  // Determine current risk level
  const currentRisk = getRiskLevel(heatIndex);

  /**
   * Trigger haptic feedback and notification for high-risk conditions
   */
  const triggerHighRiskAlert = useCallback((risk: RiskLevel) => {
    // Trigger haptic feedback based on risk level
    const hapticPatterns: Record<RiskLevel, () => void> = {
      LOW: HapticFeedback.success,
      MODERATE: HapticFeedback.medium,
      HIGH: HapticFeedback.heavy,
      EXTREME: HapticFeedback.error,
    };

    hapticPatterns[risk]();

    // Trigger visual alert (for web/platform compatibility) for any risk above LOW
    if (Platform.OS === 'web' && (risk === 'HIGH' || risk === 'EXTREME')) {
      Alert.alert(
        'Heat Safety Alert',
        `Heat index is ${risk}. ${getRecommendedAction(risk)}.`,
        [
          { text: 'OK', style: 'default' },
          { text: 'View Details', style: 'default' }
        ]
      );
    }
  }, []);

  // Alert on risk level change
  useEffect(() => {
    if (previousRisk !== null && currentRisk !== previousRisk && onRiskChange) {
      onRiskChange(previousRisk, currentRisk);
    }
    setPreviousRisk(currentRisk);
  }, [currentRisk, previousRisk, onRiskChange]);

  // Trigger alerts for high-risk levels. Re-alerts when the risk escalates to a
  // higher level (alertedRisk) so users are re-notified on worsening conditions.
  useEffect(() => {
    if (autoAlert && heatIndex > alertThreshold && currentRisk !== alertedRisk) {
      triggerHighRiskAlert(currentRisk);
      setAlertedRisk(currentRisk);
    }
  }, [heatIndex, autoAlert, alertThreshold, currentRisk, alertedRisk, triggerHighRiskAlert]);

  // Reset alert flag when risk level drops
  useEffect(() => {
    if (heatIndex <= alertThreshold) {
      setAlertedRisk(null);
    }
  }, [heatIndex, alertThreshold]);

  /**
   * Get current alert status
   */
  const getAlertStatus = (): {
    hasAlert: boolean;
    status: 'safe' | 'moderate' | 'high' | 'extreme';
    message: string;
  } => {
    if (heatIndex <= alertThreshold) {
      return {
        hasAlert: false,
        status: 'safe',
        message: 'Safe conditions'
      };
    }

    switch (currentRisk) {
      case 'MODERATE':
        return {
          hasAlert: true,
          status: 'moderate',
          message: 'Moderate heat risk - Take precautions'
        };
      case 'HIGH':
        return {
          hasAlert: true,
          status: 'high',
          message: 'High heat risk - Modify practice'
        };
      case 'EXTREME':
        return {
          hasAlert: true,
          status: 'extreme',
          message: 'Extreme heat risk - Cancel outdoor practice'
        };
      default:
        return {
          hasAlert: false,
          status: 'safe',
          message: 'Safe conditions'
        };
    }
  };

  const alertStatus = getAlertStatus();

  const alertStatusStyles = {
    safe: styles.safeAlert,
    moderate: styles.moderateAlert,
    high: styles.highAlert,
    extreme: styles.extremeAlert,
  };

  // Render alert indicator when there's an active risk
  if (alertStatus.hasAlert) {
    return (
      <View
        style={[styles.alertContainer, alertStatusStyles[alertStatus.status]]}
        testID={testID}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Heat safety alert: ${alertStatus.message}`}
      >
        <ColorCode
          heatIndex={heatIndex}
          size="small"
          showLabel={true}
          showDescription={true}
        />
        <Text style={styles.alertMessage}>{alertStatus.message}</Text>
      </View>
    );
  }

  return null;
};

/**
 * Risk Level Badge Component
 *
 * Display risk level badges in practice lists and summaries
 */
interface RiskBadgeProps {
  riskLevel: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  testID?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  riskLevel,
  size = 'small',
  showLabel = true,
  testID
}) => {
  const color = getRiskColor(riskLevel);

  const badgeSizeStyles = {
    small: styles.badge_small,
    medium: styles.badge_medium,
    large: styles.badge_large,
  };
  const textSizeStyles = {
    small: styles.text_small,
    medium: styles.text_medium,
    large: styles.text_large,
  };

  return (
    <View
      style={[
        styles.badgeContainer,
        { backgroundColor: color },
        badgeSizeStyles[size]
      ]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${riskLevel} risk level`}
    >
      {showLabel && (
        <Text
          style={[styles.badgeText, textSizeStyles[size]]}
          numberOfLines={1}
        >
          {riskLevel}
        </Text>
      )}
    </View>
  );
};

/**
 * Heat Index Summary Component
 *
 * Display practice heat index summary with risk level indicators
 */
interface HeatIndexSummaryProps {
  heatIndex: number;
  practiceName?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  testID?: string;
}

export const HeatIndexSummary: React.FC<HeatIndexSummaryProps> = ({
  heatIndex,
  practiceName,
  size = 'medium',
  showLabel = true,
  testID
}) => {
  const containerSizeStyles = {
    small: styles.container_small,
    medium: styles.container_medium,
    large: styles.container_large,
  };
  const nameSizeStyles = {
    small: styles.name_small,
    medium: styles.name_medium,
    large: styles.name_large,
  };

  return (
    <View
      style={[styles.summaryContainer, containerSizeStyles[size]]}
      testID={testID}
    >
      <Text style={[styles.practiceName, nameSizeStyles[size]]}>
        {practiceName}
      </Text>
      <ColorCode
        heatIndex={heatIndex}
        size={size}
        showLabel={showLabel}
      />
    </View>
  );
};

// Export utility functions
export { getRiskLevel, getRiskColor, getRecommendedAction } from './ColorCode';

const styles = StyleSheet.create({
  // Alert styles
  alertContainer: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    marginVertical: 8,
    padding: 12,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },

  // Badge styles
  badgeContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: PALETTE.WHITE,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  badge_large: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badge_medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badge_small: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  // Summary styles
  container_large: {
    padding: 20,
  },
  container_medium: {
    padding: 16,
  },
  container_small: {
    padding: 12,
  },

  // Alert color variants
  extremeAlert: {
    borderColor: PALETTE.RED_600,
  },
  highAlert: {
    borderColor: PALETTE.ORANGE_500,
  },
  moderateAlert: {
    borderColor: PALETTE.AMBER_400,
  },
  name_large: {
    fontSize: 18,
  },
  name_medium: {
    fontSize: 16,
  },
  name_small: {
    fontSize: 14,
  },
  practiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  safeAlert: {
    borderColor: PALETTE.GREEN_500,
  },
  summaryContainer: {
    borderRadius: 12,
    borderWidth: 2,
    marginVertical: 8,
    padding: 16,
  },
  text_large: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 12,
  },
  text_small: {
    fontSize: 10,
  },
});