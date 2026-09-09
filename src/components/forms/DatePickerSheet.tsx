import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native'
import { APP_CONSTANTS } from '../../types'
import { PALETTE } from '../../utils/outdoorColors'
import {
  DateParts,
  buildMonthGrid,
  shiftMonth,
  formatDate,
  parseDate,
  todayString,
  monthName,
  dateLabel,
  WEEKDAYS,
} from '../../utils/dateTime'

const { COLORS, SPACING, FONT_SIZES } = APP_CONSTANTS

interface DatePickerSheetProps {
  /** Controls visibility of the bottom-sheet modal. */
  visible: boolean
  /** Currently selected date as YYYY-MM-DD. Shown pre-selected when the sheet opens. */
  initialDate: string
  /** Called when the user confirms a date. Payload is a valid YYYY-MM-DD string. */
  onConfirm: (date: string) => void
  /** Called when the user dismisses without confirming. Value unchanged. */
  onClose: () => void
}

const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  visible,
  initialDate,
  onConfirm,
  onClose,
}) => {
  const initial = parseDate(initialDate) ?? parseDate(todayString())
  const [viewYear, setViewYear] = useState(initial?.year ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(initial?.month ?? new Date().getMonth() + 1)
  const [selected, setSelected] = useState<DateParts | null>(initial)

  // Re-sync picker state whenever the sheet opens or the initial date changes,
  // so a previously edited value does not persist into the next open.
  useEffect(() => {
    if (visible) {
      const sync = parseDate(initialDate) ?? parseDate(todayString())
      setViewYear(sync?.year ?? new Date().getFullYear())
      setViewMonth(sync?.month ?? new Date().getMonth() + 1)
      setSelected(sync)
    }
  }, [visible, initialDate])

  const { cells } = buildMonthGrid(viewYear, viewMonth)

  const goPrev = () => {
    const next = shiftMonth(viewYear, viewMonth, -1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  const goNext = () => {
    const next = shiftMonth(viewYear, viewMonth, 1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  const handleConfirm = () => {
    if (!selected) {
      return
    }
    onConfirm(formatDate(selected))
  }

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
        testID="date-picker-sheet"
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessible={true}
          accessibilityLabel="Close date picker"
          accessibilityRole="button"
          testID="date-picker-backdrop"
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity
              onPress={goPrev}
              accessible={true}
              accessibilityLabel="Previous month"
              accessibilityRole="button"
              style={styles.navButton}
              testID="date-prev-month"
            >
              <Text style={styles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>
              {monthName(viewMonth)} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={goNext}
              accessible={true}
              accessibilityLabel="Next month"
              accessibilityRole="button"
              style={styles.navButton}
              testID="date-next-month"
            >
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map(wd => (
              <Text key={wd} style={styles.weekdayText}>
                {wd}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map(cell => {
              if (!cell.date) {
                return <View key={cell.key} style={styles.dayCell} />
              }
              const isSelected =
                selected !== null &&
                selected.year === cell.date.year &&
                selected.month === cell.date.month &&
                selected.day === cell.date.day
              return (
                <TouchableOpacity
                  key={cell.key}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => setSelected(cell.date)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={dateLabel(cell.date)}
                  accessibilityState={{ selected: isSelected }}
                  testID={`date-day-${formatDate(cell.date)}`}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {cell.dayOfMonth}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Confirm date"
              testID="date-confirm"
            >
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  buttonRow: {
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.MD,
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: SPACING.MD,
  },
  confirmText: {
    color: COLORS.CARD_BACKGROUND,
    fontSize: FONT_SIZES.BODY,
    fontWeight: '600',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    width: '14.285%',
  },
  dayCellSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SPACING.SM,
  },
  dayText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.BODY,
  },
  dayTextSelected: {
    color: COLORS.CARD_BACKGROUND,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
  },
  modalOverlay: {
    backgroundColor: PALETTE.OVERLAY,
    flex: 1,
    justifyContent: 'flex-end',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  navText: {
    color: COLORS.PRIMARY,
    fontSize: FONT_SIZES.TITLE,
    fontWeight: 'bold',
  },
  sheet: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderTopLeftRadius: SPACING.LG,
    borderTopRightRadius: SPACING.LG,
    maxHeight: '80%',
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: COLORS.BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.LG,
  },
  sheetTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: FONT_SIZES.SUBTITLE,
    fontWeight: 'bold',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.SM,
    paddingTop: SPACING.SM,
  },
  weekdayText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: FONT_SIZES.CAPTION,
    textAlign: 'center',
    width: '14.285%',
  },
})

export default DatePickerSheet