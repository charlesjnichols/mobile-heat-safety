import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { PALETTE } from '../../utils/outdoorColors';

interface FabProps {
  onPress: () => void;
  accessibilityLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
}

export const Fab: React.FC<FabProps> = ({
  onPress,
  accessibilityLabel = 'Add',
  icon = 'add',
  testID = 'fab-add',
}) => {
  const handlePress = () => {
    HapticFeedback.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={28} color={PALETTE.WHITE} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    backgroundColor: PALETTE.BLUE_500,
    borderRadius: 28,
    bottom: 24,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 56,
  },
});

export default Fab;