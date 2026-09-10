import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getHeatRisk, HEAT_THRESHOLDS } from '../../utils/heatIndex';
import { PALETTE } from '../../utils/outdoorColors';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

// Human-readable labels/descriptions per risk level (colors/thresholds come from shared HEAT_THRESHOLDS)
const RISK_META = {
  LOW: { label: 'LOW', description: 'Safe conditions' },
  MODERATE: { label: 'MODERATE', description: 'Take precautions' },
  HIGH: { label: 'HIGH', description: 'Modify practice' },
  EXTREME: { label: 'EXTREME', description: 'Cancel practice' },
} as const;

interface ColorCodeProps {
  heatIndex: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showDescription?: boolean;
  customColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * ColorCode Component
 *
 * Displays heat index with color-coded risk levels optimized for outdoor visibility.
 * Uses high-contrast colors that are easily distinguishable in bright sunlight.
 *
 * @param heatIndex - Temperature in Fahrenheit
 * @param size - Display size (small/medium/large)
 * @param showLabel - Whether to show risk level label
 * @param showDescription - Whether to show descriptive text
 * @param customColor - Optional custom color override
 * @param style - Additional styling
 * @param testID - Testing identifier
 */
export const ColorCode: React.FC<ColorCodeProps> = ({
  heatIndex,
  size = 'medium',
  showLabel = true,
  showDescription = true,
  customColor,
  style,
  testID
}) => {
  // Determine risk level and color
  const riskLevel = getRiskLevel(heatIndex);
  const color = customColor || HEAT_THRESHOLDS[riskLevel].color;
  const meta = RISK_META[riskLevel];

  // Size variants
  const sizeStyles = {
    small: {
      padding: 4,
      borderRadius: 4,
      fontSize: 12,
    },
    medium: {
      padding: 8,
      borderRadius: 6,
      fontSize: 14,
    },
    large: {
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
    }
  };

  const labelSizeStyles = {
    small: styles.label_small,
    medium: styles.label_medium,
    large: styles.label_large,
  };

  const descriptionSizeStyles = {
    small: styles.description_small,
    medium: styles.description_medium,
    large: styles.description_large,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: color },
        sizeStyles[size],
        style
      ]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${heatIndex}°F - ${riskLevel} Risk`}
      accessibilityRole="alert"
    >
      {showLabel && (
        <Text
          style={[styles.label, styles.labelText, labelSizeStyles[size]]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
      )}
      {showDescription && (
        <Text
          style={[styles.description, styles.descriptionText, descriptionSizeStyles[size]]}
          numberOfLines={1}
          accessibilityLabel={meta.description}
        >
          {meta.description}
        </Text>
      )}
    </View>
  );
};

/**
 * Get risk level from heat index value
 * @param heatIndex - Temperature in Fahrenheit
 * @returns Risk level ('LOW' | 'MODERATE' | 'HIGH' | 'EXTREME')
 */
export const getRiskLevel = (heatIndex: number): RiskLevel => {
  return getHeatRisk(heatIndex);
};

/**
 * Get color for a specific risk level
 * @param riskLevel - Risk level to get color for
 * @returns Hex color code
 */
export const getRiskColor = (riskLevel: RiskLevel): string => {
  return HEAT_THRESHOLDS[riskLevel].color;
};

/**
 * Check if heat index requires action
 * @param heatIndex - Temperature in Fahrenheit
 * @returns true if heat index requires safety precautions
 */
export const requiresSafetyAction = (heatIndex: number): boolean => {
  return heatIndex > HEAT_THRESHOLDS.LOW.max;
};

/**
 * Get recommended action based on risk level
 * @param riskLevel - Risk level to get action for
 * @returns Recommended safety action
 */
export const getRecommendedAction = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'LOW':
      return 'No restrictions';
    case 'MODERATE':
      return 'Water breaks every 30 minutes';
    case 'HIGH':
      return 'Modified practice (reduced intensity)';
    case 'EXTREME':
      return 'Cancel outdoor practice';
    default:
      return 'Monitor conditions';
  }
};

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  customColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * RiskBadge Component
 *
 * Compact badge displaying the current risk level with color coding.
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({
  riskLevel,
  size = 'medium',
  showLabel = true,
  customColor,
  style,
  testID
}) => {
  const color = customColor || HEAT_THRESHOLDS[riskLevel].color;

  const badgeSizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2 },
    medium: { paddingHorizontal: 10, paddingVertical: 4 },
    large: { paddingHorizontal: 14, paddingVertical: 6 },
  };

  return (
    <View
      style={[styles.badge, { backgroundColor: color }, badgeSizeStyles[size], style]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${riskLevel} risk level`}
      accessibilityRole="text"
    >
      {showLabel && (
        <Text style={styles.badgeLabel} numberOfLines={1}>
          {riskLevel}
        </Text>
      )}
    </View>
  );
};

interface HeatIndexSummaryProps {
  heatIndex: number;
  practiceName: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  customColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * HeatIndexSummary Component
 *
 * Combines the practice name with a color-coded heat index indicator.
 */
export const HeatIndexSummary: React.FC<HeatIndexSummaryProps> = ({
  heatIndex,
  practiceName,
  size = 'medium',
  showLabel = true,
  customColor,
  style,
  testID
}) => {
  const riskLevel = getRiskLevel(heatIndex);
  const color = customColor || HEAT_THRESHOLDS[riskLevel].color;

  const nameSizeStyles = {
    small: 12,
    medium: 14,
    large: 16,
  };

  const valueSizeStyles = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <View
      style={[styles.summaryContainer, style]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${practiceName}: ${heatIndex}°F - ${riskLevel} Risk`}
      accessibilityRole="summary"
    >
      <Text style={[styles.summaryName, { fontSize: nameSizeStyles[size] }]} numberOfLines={1}>
        {practiceName}
      </Text>
      <Text style={[styles.summaryValue, { fontSize: valueSizeStyles[size], color }]}>
        {heatIndex}°F
      </Text>
      {showLabel && (
        <RiskBadge riskLevel={riskLevel} size={size} customColor={customColor} />
      )}
    </View>
  );
};
// Export constants
const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
  },
  badgeLabel: {
    color: PALETTE.WHITE,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  container: {
    alignItems: 'center',
    borderColor: PALETTE.BLACK_10,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    minWidth: 100,
    padding: 8,
  },
  description: {
    fontSize: 10,
    marginTop: 2,
  },
  descriptionText: {
    color: PALETTE.WHITE,
  },
  description_large: {
    fontSize: 12,
  },
  description_medium: {
    fontSize: 10,
  },
  description_small: {
    fontSize: 8,
  },
  label: {
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelText: {
    color: PALETTE.WHITE,
  },
  label_large: {
    fontSize: 16,
  },
  label_medium: {
    fontSize: 14,
  },
  label_small: {
    fontSize: 12,
  },
  summaryContainer: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 8,
    padding: 12,
  },
  summaryName: {
    color: PALETTE.GRAY_NEUTRAL,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});