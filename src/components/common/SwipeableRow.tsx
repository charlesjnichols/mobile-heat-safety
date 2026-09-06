import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/hapticFeedback';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  testID?: string;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Delete',
  testID,
}) => {
  const renderRightActions = () => (
    <View style={styles.swipeDeleteContainer}>
      <TouchableOpacity
        style={styles.swipeDeleteButton}
        onPress={onDelete}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        testID={testID ? `swipe-delete-${testID}` : undefined}
      >
        <Ionicons name="trash-outline" size={20} color="#ffffff" />
        <Text style={styles.swipeDeleteText}>{deleteLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  // Expose delete as an accessibility action so screen-reader users
  // (VoiceOver/TalkBack) can delete without a swipe gesture.
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        accessibilityActions: [{ name: 'delete', label: deleteLabel }],
        onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) => {
          if (event.nativeEvent.actionName === 'delete') {
            onDelete();
          }
        },
      })
    : children;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => HapticFeedback.light()}
      overshootRight={false}
    >
      {child}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  swipeDeleteButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  swipeDeleteContainer: {
    backgroundColor: '#dc2626',
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    width: 96,
  },
  swipeDeleteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default SwipeableRow;