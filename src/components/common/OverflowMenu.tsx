import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { PALETTE } from '../../utils/outdoorColors';

export interface OverflowMenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  accessibilityLabel?: string;
  testID?: string;
}

export const OverflowMenu: React.FC<OverflowMenuProps> = ({
  items,
  accessibilityLabel = 'More options',
  testID = 'overflow-menu',
}) => {
  const [visible, setVisible] = React.useState(false);

  const handleOpen = () => {
    HapticFeedback.light();
    setVisible(true);
  };

  const handleSelect = (item: OverflowMenuItem) => {
    setVisible(false);
    item.onPress();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleOpen}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color={PALETTE.BLUE_500} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menuCard}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => handleSelect(item)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                testID={`${testID}-item-${item.key}`}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.destructive ? PALETTE.RED_600 : PALETTE.NEUTRAL_800}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    item.destructive && styles.menuItemTextDestructive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuCard: {
    backgroundColor: PALETTE.WHITE,
    borderRadius: 12,
    elevation: 5,
    minWidth: 200,
    overflow: 'hidden',
    paddingVertical: 8,
    shadowColor: PALETTE.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  menuItemText: {
    color: PALETTE.NEUTRAL_800,
    fontSize: 16,
    marginLeft: 12,
  },
  menuItemTextDestructive: {
    color: PALETTE.RED_600,
  },
  overlay: {
    alignItems: 'flex-end',
    backgroundColor: PALETTE.BLACK_30,
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
});

export default OverflowMenu;