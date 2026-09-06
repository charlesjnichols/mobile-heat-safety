import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime12 } from '../../utils/dateTime';

// Heat index thresholds and colors
const HEAT_THRESHOLDS = {
  LOW: { max: 80, color: '#22c55e', label: 'LOW' },
  MODERATE: { max: 90, color: '#eab308', label: 'MODERATE' },
  HIGH: { max: 105, color: '#f97316', label: 'HIGH' },
  EXTREME: { max: Infinity, color: '#dc2626', label: 'EXTREME' },
} as const;

// Risk level colors with high contrast for outdoor visibility
const RISK_COLORS = {
  LOW: { bg: '#22c55e', text: '#ffffff', border: '#16a34a' },
  MODERATE: { bg: '#eab308', text: '#ffffff', border: '#ca8a04' },
  HIGH: { bg: '#f97316', text: '#ffffff', border: '#ea580c' },
  EXTREME: { bg: '#dc2626', text: '#ffffff', border: '#b91c1c' },
} as const;

// Risk level icons
const RISK_ICONS: Record<'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME', keyof typeof Ionicons.glyphMap> = {
  LOW: 'checkmark-circle',
  MODERATE: 'alert-circle',
  HIGH: 'warning',
  EXTREME: 'alert',
};

// Risk level descriptions for accessibility
const RISK_DESCRIPTIONS = {
  LOW: 'Low heat risk - Safe for normal activity',
  MODERATE: 'Moderate heat risk - Stay hydrated and monitor',
  HIGH: 'High heat risk - Reduce intensity, increase breaks',
  EXTREME: 'Extreme heat risk - Cancel or move indoors',
} as const;

interface HeatIndexIndicatorProps {
  value: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'simple' | 'detailed' | 'compact';
  showDescription?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const HeatIndexIndicator: React.FC<HeatIndexIndicatorProps> = ({
  value,
  size = 'medium',
  variant = 'simple',
  showDescription = false,
  onPress,
  accessibilityLabel,
  style,
  textStyle,
  testID,
}) => {
  // Determine risk level
  const riskLevel = React.useMemo(() => {
    if (value <= HEAT_THRESHOLDS.LOW.max) return 'LOW';
    if (value <= HEAT_THRESHOLDS.MODERATE.max) return 'MODERATE';
    if (value <= HEAT_THRESHOLDS.HIGH.max) return 'HIGH';
    return 'EXTREME';
  }, [value]);

  // Get risk level data
  const riskData = React.useMemo(() => ({
    level: riskLevel,
    threshold: HEAT_THRESHOLDS[riskLevel as keyof typeof HEAT_THRESHOLDS],
    colors: RISK_COLORS[riskLevel as keyof typeof RISK_COLORS],
    icon: RISK_ICONS[riskLevel as keyof typeof RISK_ICONS],
    description: RISK_DESCRIPTIONS[riskLevel as keyof typeof RISK_DESCRIPTIONS],
  }), [riskLevel]);

  // Size-based styling
  const sizeStyles = React.useMemo<{
    container: { paddingVertical: number; paddingHorizontal: number; minHeight: number };
    text: TextStyle;
    value: TextStyle;
    icon: { size: number };
    description: TextStyle;
  }>(() => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 4, paddingHorizontal: 8, minHeight: 32 },
          text: { fontSize: 12, fontWeight: '500' },
          value: { fontSize: 14, fontWeight: '600' },
          icon: { size: 16 },
          description: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 },
          text: { fontSize: 18, fontWeight: '600' },
          value: { fontSize: 24, fontWeight: '700' },
          icon: { size: 32 },
          description: { fontSize: 14 },
        };
      default: // medium
        return {
          container: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 44 },
          text: { fontSize: 14, fontWeight: '600' },
          value: { fontSize: 18, fontWeight: '700' },
          icon: { size: 24 },
          description: { fontSize: 12 },
        };
    }
  }, [size]);

  // Component styles (plain objects to keep styles co-located with dynamic values)
  const styles = React.useMemo<{
    compactContainer: ViewStyle;
    container: ViewStyle;
    description: TextStyle;
    icon: TextStyle & { size?: number };
    text: TextStyle;
    touchable: ViewStyle;
    value: TextStyle;
  }>(() => ({
    compactContainer: {
      alignItems: 'center',
      backgroundColor: riskData.colors.bg,
      borderColor: riskData.colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      ...style,
    },
    container: {
      alignItems: 'center',
      backgroundColor: riskData.colors.bg,
      borderColor: riskData.colors.border,
      borderRadius: sizeStyles.container.minHeight / 2,
      borderWidth: 2,
      flexDirection: 'row',
      justifyContent: 'center',
      ...sizeStyles.container,
      ...style,
    },
    description: {
      color: riskData.colors.text,
      ...sizeStyles.description,
      marginTop: 4,
      textAlign: 'center',
    },
    icon: {
      color: riskData.colors.text,
      ...sizeStyles.icon,
    },
    text: {
      color: riskData.colors.text,
      ...sizeStyles.text,
      ...textStyle,
    },
    touchable: {
      alignItems: 'center',
      borderRadius: sizeStyles.container.minHeight / 2,
      flexDirection: 'row',
      justifyContent: 'center',
      ...sizeStyles.container,
    },
    value: {
      color: riskData.colors.text,
      ...sizeStyles.value,
      ...textStyle,
    },
  }), [riskData, sizeStyles, style, textStyle]);

  // Render simple variant
  if (variant === 'simple') {
    const SimpleComponent = () => (
      <View style={styles.container} testID={testID}>
        <Ionicons name={riskData.icon} style={styles.icon} />
        <Text style={styles.text}>{value}°F</Text>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          style={styles.touchable}
          onPress={onPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Heat index ${value}°F - ${riskData.description}`}
          testID={testID}
        >
          <Ionicons name={riskData.icon} style={styles.icon} />
          <Text style={styles.text}>{value}°F</Text>
        </TouchableOpacity>
      );
    }

    return <SimpleComponent />;
  }

  // Render compact variant
  if (variant === 'compact') {
    const CompactComponent = () => (
      <View style={styles.compactContainer} testID={testID}>
        <Ionicons name={riskData.icon} style={styles.icon} />
        <Text style={styles.text}>{value}°F</Text>
      </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          style={styles.compactContainer}
          onPress={onPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Heat index ${value}°F - ${riskData.description}`}
          testID={testID}
        >
          <Ionicons name={riskData.icon} style={styles.icon} />
          <Text style={styles.text}>{value}°F</Text>
        </TouchableOpacity>
      );
    }

    return <CompactComponent />;
  }

  // Render detailed variant (default)
  const DetailedComponent = () => (
    <View style={styles.container} testID={testID}>
      <Ionicons name={riskData.icon} style={styles.icon} />
      <View style={{ marginLeft: 8 }}>
        <Text style={styles.text}>{riskData.level} RISK</Text>
        {variant === 'detailed' && (
          <Text style={styles.value}>{value}°F</Text>
        )}
        {showDescription && (
          <Text style={styles.description}>{riskData.description}</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `Heat index ${value}°F - ${riskData.description}`}
        testID={testID}
      >
        <Ionicons name={riskData.icon} style={styles.icon} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.text}>{riskData.level} RISK</Text>
          {variant === 'detailed' && (
            <Text style={styles.value}>{value}°F</Text>
          )}
          {showDescription && (
            <Text style={styles.description}>{riskData.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return <DetailedComponent />;
};

// Helper component for practice-level heat index display
interface PracticeHeatIndicatorProps {
  practice: {
    checklists: {
      heatIndex: number;
      time: string;
    }[];
  };
  size?: 'small' | 'medium' | 'large';
  variant?: 'simple' | 'detailed' | 'compact';
  showMax?: boolean;
  showTime?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PracticeHeatIndicator: React.FC<PracticeHeatIndicatorProps> = ({
  practice,
  size = 'medium',
  variant = 'simple',
  showMax = false,
  showTime = false,
  onPress,
  style,
}) => {
  // Calculate max heat index from practice checklists
  const maxHeatIndex = React.useMemo(() => {
    if (practice.checklists.length === 0) return 0;
    return Math.max(...practice.checklists.map(c => c.heatIndex));
  }, [practice.checklists]);

  // Get time of max heat index
  const maxHeatTime = React.useMemo(() => {
    if (practice.checklists.length === 0) return '';
    const maxChecklist = practice.checklists.reduce((max, current) => 
      current.heatIndex > max.heatIndex ? current : max
    );
    return maxChecklist.time;
  }, [practice.checklists]);

  // Create accessibility label
  const accessibilityLabel = React.useMemo(() => {
    const riskLevel = maxHeatIndex <= 80 ? 'LOW' :
                     maxHeatIndex <= 90 ? 'MODERATE' :
                     maxHeatIndex <= 105 ? 'HIGH' : 'EXTREME';

    let label = `Maximum heat index ${maxHeatIndex}°F - ${riskLevel} risk`;
    if (showTime && maxHeatTime) {
      label += ` at ${formatTime12(maxHeatTime)}`;
    }
    return label;
  }, [maxHeatIndex, maxHeatTime, showTime]);

  // If no checklists, show placeholder
  if (practice.checklists.length === 0) {
    return (
      <View style={[
        styles.emptyContainer,
        size === 'small' && styles.emptySmall,
        size === 'medium' && styles.emptyMedium,
        size === 'large' && styles.emptyLarge,
        style,
      ]}>
        <Ionicons name="thermometer-outline" size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} color="#9ca3af" />
        <Text style={[
          styles.emptyText,
          size === 'small' && styles.emptyTextSmall,
          size === 'medium' && styles.emptyTextMedium,
          size === 'large' && styles.emptyTextLarge,
        ]}>
          No data
        </Text>
      </View>
    );
  }

  return (
    <HeatIndexIndicator
      value={maxHeatIndex}
      size={size}
      variant={variant}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={style}
    />
  );
};

// Style constants
const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyLarge: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyMedium: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptySmall: {
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyText: {
    color: '#9ca3af',
    marginLeft: 4,
  },
  emptyTextLarge: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyTextMedium: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default HeatIndexIndicator;