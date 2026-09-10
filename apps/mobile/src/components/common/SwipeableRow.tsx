import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/hapticFeedback';
import { PALETTE } from '../../utils/outdoorColors';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  testID?: string;
}

type AccessibilityActionEvent = {
  nativeEvent: { actionName: string };
};

const DELETE_ACTION = 'delete';

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Delete',
  testID,
}) => {
  const handleDelete = useCallback(() => {
    HapticFeedback.medium();
    try {
      onDelete();
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Unable to delete. Please try again.');
    }
  }, [onDelete]);

  // Memoize the render actions so the row does not re-render unnecessarily.
  const renderRightActions = useCallback(() => (
    <View style={styles.swipeDeleteContainer}>
      <TouchableOpacity
        style={styles.swipeDeleteButton}
        onPress={handleDelete}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        testID={testID ? `swipe-delete-${testID}` : undefined}
      >
        <Ionicons name="trash-outline" size={20} color={PALETTE.WHITE} />
        <Text style={styles.swipeDeleteText}>{deleteLabel}</Text>
      </TouchableOpacity>
    </View>
  ), [handleDelete, deleteLabel, testID]);

  // Only a single element child can receive injected accessibility props.
  const isSingleElement = React.isValidElement(children);

  // Expose delete as an accessibility action so screen-reader users
  // (VoiceOver/TalkBack) can delete without a swipe gesture. Merges rather than
  // overwrites the child's existing accessibility props.
  const child = useMemo(() => {
    if (!isSingleElement) {
      return children;
    }

    const element = children as React.ReactElement<Record<string, unknown>>;
    const existingActions = (element.props.accessibilityActions as { name: string }[]) || [];
    const existingHandler = element.props.onAccessibilityAction;

    const composedHandler = (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === DELETE_ACTION) {
        handleDelete();
        return;
      }
      if (typeof existingHandler === 'function') {
        existingHandler(event as never);
      }
    };

    return React.cloneElement(element, {
      accessibilityActions: [...existingActions, { name: DELETE_ACTION, label: deleteLabel }],
      onAccessibilityAction: composedHandler,
    });
  }, [children, isSingleElement, deleteLabel, handleDelete]);

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
    backgroundColor: PALETTE.RED_600,
    borderBottomRightRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    width: 96,
  },
  swipeDeleteText: {
    color: PALETTE.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default SwipeableRow;