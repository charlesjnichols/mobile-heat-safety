import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native'
import { APP_CONSTANTS } from '../../types'
import { PALETTE } from '../../utils/outdoorColors'
import {
  formatTime,
  parseTime,
  nowTimeString,
  to12Hour,
  from12Hour,
  AmPm,
} from '../../utils/dateTime'

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const PERIODS: AmPm[] = ['AM', 'PM']

interface TimePickerSheetProps {
  /** Controls visibility of the bottom-sheet modal. */
  visible: boolean
  /** Currently selected time as HH:MM (24-hour storage). Shown pre-selected when the sheet opens. */
  initialTime: string
  /** Called when the user confirms a time. Payload is a valid HH:MM (24-hour) string. */
  onConfirm: (time: string) => void
  /** Called when the user dismisses without confirming. Value unchanged. */
  onClose: () => void
}

const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  visible,
  initialTime,
  onConfirm,
  onClose,
}) => {
  const initial = parseTime(initialTime) ?? parseTime(nowTimeString())
  const initial12 = to12Hour(initial?.hour ?? 0)
  const [hour12, setHour12] = useState(initial12.hour)
  const [minute, setMinute] = useState(initial?.minute ?? 0)
  const [period, setPeriod] = useState<AmPm>(initial12.period)

  // Re-sync picker state whenever the sheet opens or the initial time changes,
  // so a previously edited value does not persist into the next open.
  useEffect(() => {
    if (visible) {
      const sync = parseTime(initialTime) ?? parseTime(nowTimeString())
      const sync12 = to12Hour(sync?.hour ?? 0)
      setHour12(sync12.hour)
      setMinute(sync?.minute ?? 0)
      setPeriod(sync12.period)
    }
  }, [visible, initialTime])

  const handleConfirm = () => {
    const hour24 = from12Hour(hour12, period)
    onConfirm(formatTime({ hour: hour24, minute }))
  }

  const renderWheelItem = (
    value: number,
    selected: boolean,
    onPress: (v: number) => void,
    testID: (v: number) => string,
    label: (v: number) => string,
    accessibilityLabel: string
  ) => (
    <TouchableOpacity
      style={[styles.wheelItem, selected && styles.wheelItemSelected]}
      onPress={() => onPress(value)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      testID={testID(value)}
    >
      <Text style={[styles.wheelText, selected && styles.wheelTextSelected]}>
        {label(value)}
      </Text>
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={styles.modalOverlay}
        accessibilityViewIsModal={true}
        testID="time-picker-sheet"
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessible={true}
          accessibilityLabel="Close time picker"
          accessibilityRole="button"
          testID="time-picker-backdrop"
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Time</Text>
            <TouchableOpacity
              onPress={onClose}
              accessible={true}
              accessibilityLabel="Close time picker"
              accessibilityRole="button"
            >
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wheelContainer}>
            <FlatList
              testID="time-hour-wheel"
              data={HOURS}
              keyExtractor={h => `hour-${h}`}
              renderItem={({ item }) =>
                renderWheelItem(
                  item,
                  item === hour12,
                  setHour12,
                  v => `time-hour-${v}`,
                  v => v.toString(),
                  `${item} hour`
                )
              }
              initialScrollIndex={hour12 - 1}
              getItemLayout={(_, index) => ({
                length: WHEEL_ITEM_HEIGHT,
                offset: WHEEL_ITEM_HEIGHT * index,
                index,
              })}
              showsVerticalScrollIndicator={false}
              style={styles.wheel}
            />
            <Text style={styles.separator}>:</Text>
            <FlatList
              testID="time-minute-wheel"
              data={MINUTES}
              keyExtractor={m => `minute-${m}`}
              renderItem={({ item }) =>
                renderWheelItem(
                  item,
                  item === minute,
                  setMinute,
                  v => `time-minute-${v}`,
                  v => v.toString().padStart(2, '0'),
                  `${item.toString().padStart(2, '0')} minute`
                )
              }
              initialScrollIndex={minute}
              getItemLayout={(_, index) => ({
                length: WHEEL_ITEM_HEIGHT,
                offset: WHEEL_ITEM_HEIGHT * index,
                index,
              })}
              showsVerticalScrollIndicator={false}
              style={styles.wheel}
            />
          </View>

          <View style={styles.periodRow}>
            {PERIODS.map(p => {
              const isSelected = p === period
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodButton, isSelected && styles.periodButtonSelected]}
                  onPress={() => setPeriod(p)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${p} period`}
                  accessibilityState={{ selected: isSelected }}
                  testID={`time-period-${p}`}
                >
                  <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.confirmRow}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Confirm time"
              testID="time-confirm"
            >
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const WHEEL_ITEM_HEIGHT = 44

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.MD,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: SPACING.MD,
  },
  confirmRow: {
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  confirmText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  modalOverlay: {
    backgroundColor: PALETTE.OVERLAY,
    flex: 1,
    justifyContent: 'flex-end',
  },
  periodButton: {
    alignItems: 'center',
    borderRadius: SPACING.SM,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: SPACING.MD,
  },
  periodButtonSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: SPACING.SM,
  },
  periodText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.SUBTITLE,
    fontWeight: '600',
  },
  periodTextSelected: {
    color: COLORS.CARD_BACKGROUND,
  },
  separator: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.TITLE,
  },
  sheet: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopLeftRadius: SPACING.LG,
    borderTopRightRadius: SPACING.LG,
    maxHeight: '80%',
  },
  sheetClose: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TITLE,
    padding: SPACING.SM,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  sheetTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
  },
  wheel: {
    height: WHEEL_ITEM_HEIGHT * 5,
  },
  wheelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
  },
  wheelItem: {
    alignItems: 'center',
    height: WHEEL_ITEM_HEIGHT,
    justifyContent: 'center',
  },
  wheelItemSelected: {
    backgroundColor: COLORS.BACKGROUND,
  },
  wheelText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.TITLE,
  },
  wheelTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
})

export default TimePickerSheet