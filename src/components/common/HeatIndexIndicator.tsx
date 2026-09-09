import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime12 } from '../../utils/dateTime';
import { getHeatRisk, RiskLevel } from '../../utils/heatIndex';
import { PALETTE } from '../../utils/outdoorColors';

// Risk level colors with high contrast for outdoor visibility
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  LOW: { bg: PALETTE.GREEN_500, text: PALETTE.WHITE, border: PALETTE.GREEN_600 },
  MODERATE: { bg: PALETTE.AMBER_400, text: PALETTE.WHITE, border: PALETTE.AMBER_500 },
  HIGH: { bg: PALETTE.ORANGE_500, text: PALETTE.WHITE, border: PALETTE.ORANGE_600 },
  EXTREME: { bg: PALETTE.RED_600, text: PALETTE.WHITE, border: PALETTE.RED_700 },
} as const;

// Risk level icons
const RISK_ICONS: Record<RiskLevel, keyof typeof Ionicons.glyphMap> = {
  LOW: 'checkmark-circle',
  MODERATE: 'alert-circle',
  HIGH: 'warning',
  EXTREME: 'alert',
};

// Risk level descriptions for accessibility
const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  LOW: 'Low heat risk - Safe for normal activity',
  MODERATE: 'Moderate heat risk - Stay hydrated and monitor',
  HIGH: 'High heat risk - Reduce intensity, increase breaks',
  EXTREME: 'Extreme heat risk - Cancel or move indoors',
};

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

interface RiskData {
  level: RiskLevel;
  colors: { bg: string; text: string; border: string };
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

// Pure helper that maps a value + size to its styling (kept outside render).
const getRiskData = (value: number): RiskData => {
  const level = getHeatRisk(value);
  return {
    level,
    colors: RISK_COLORS[level],
    icon: RISK_ICONS[level],
    description: RISK_DESCRIPTIONS[level],
  };
};

interface SizeStyles {
  container: { paddingVertical: number; paddingHorizontal: number; minHeight: number };
  text: TextStyle;
  value: TextStyle;
  icon: { size: number };
  description: TextStyle;
}

const getSizeStyles = (size: 'small' | 'medium' | 'large'): SizeStyles => {
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
};

// Hoisted sub-components (no longer re-created inside render).
interface SubContentProps {
  risk: RiskData;
  value: number;
  variant: 'simple' | 'detailed' | 'compact';
  showDescription: boolean;
  sizeStyles: SizeStyles;
  style: ViewStyle | undefined;
  textStyle: TextStyle | undefined;
}

const SimpleContent: React.FC<SubContentProps> = ({ risk, value, sizeStyles, style, textStyle }) => (
  <View style={buildContainerStyle(risk, sizeStyles, style)} testID={undefined}>
    <Ionicons name={risk.icon} size={sizeStyles.icon.size} color={risk.colors.text} />
    <Text style={[localText(risk, sizeStyles), textStyle]}>{value}°F</Text>
  </View>
);

const CompactContent: React.FC<SubContentProps> = ({ risk, value, sizeStyles, textStyle }) => (
  <View style={buildCompactContainerStyle(risk)} testID={undefined}>
    <Ionicons name={risk.icon} size={sizeStyles.icon.size} color={risk.colors.text} />
    <Text style={[localText(risk, sizeStyles), textStyle]}>{value}°F</Text>
  </View>
);

const DetailedContent: React.FC<SubContentProps> = ({
  risk,
  value,
  showDescription,
  sizeStyles,
  textStyle,
}) => (
  <>
    <Ionicons name={risk.icon} size={sizeStyles.icon.size} color={risk.colors.text} />
    <View style={styles.detailBlock}>
      <Text style={[localText(risk, sizeStyles), textStyle]}>{risk.level} RISK</Text>
      <Text style={[localValue(risk, sizeStyles), textStyle]}>{value}°F</Text>
      {showDescription && (
        <Text style={localDescription(risk, sizeStyles)}>{risk.description}</Text>
      )}
    </View>
  </>
);

// Style helpers (module scope, no shadowing).
const localText = (risk: RiskData, s: SizeStyles): TextStyle => ({
  color: risk.colors.text,
  ...s.text,
});
const localValue = (risk: RiskData, s: SizeStyles): TextStyle => ({
  color: risk.colors.text,
  ...s.value,
});
const localDescription = (risk: RiskData, s: SizeStyles): TextStyle => ({
  color: risk.colors.text,
  ...s.description,
  marginTop: 4,
  textAlign: 'center',
});
const buildContainerStyle = (risk: RiskData, s: SizeStyles, style: ViewStyle | undefined): ViewStyle => ({
  alignItems: 'center',
  backgroundColor: risk.colors.bg,
  borderColor: risk.colors.border,
  borderRadius: s.container.minHeight / 2,
  borderWidth: 2,
  flexDirection: 'row',
  justifyContent: 'center',
  ...s.container,
  ...style,
});
const buildCompactContainerStyle = (risk: RiskData): ViewStyle => ({
  alignItems: 'center',
  backgroundColor: risk.colors.bg,
  borderColor: risk.colors.border,
  borderRadius: 8,
  borderWidth: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  paddingHorizontal: 8,
  paddingVertical: 4,
});

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
  const risk = getRiskData(value);
  const sizeStyles = getSizeStyles(size);
  const a11yLabel = accessibilityLabel || `Heat index ${value}°F - ${risk.description}`;

  const contentProps: SubContentProps = {
    risk,
    value,
    variant,
    showDescription,
    sizeStyles,
    style,
    textStyle,
  };

  const content =
    variant === 'simple' ? (
      <SimpleContent {...contentProps} />
    ) : variant === 'compact' ? (
      <CompactContent {...contentProps} />
    ) : (
      <DetailedContent {...contentProps} />
    );

  if (onPress) {
    return (
      <TouchableOpacity
        style={variant === 'compact' ? buildCompactContainerStyle(risk) : buildContainerStyle(risk, sizeStyles, style)}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        testID={testID}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{content}</View>;
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
        <Ionicons name="thermometer-outline" size={size === 'small' ? 12 : size === 'medium' ? 16 : 20} color={PALETTE.NEUTRAL_400} />
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
  detailBlock: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: PALETTE.NEUTRAL_100,
    borderColor: PALETTE.NEUTRAL_200,
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
    color: PALETTE.NEUTRAL_400,
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