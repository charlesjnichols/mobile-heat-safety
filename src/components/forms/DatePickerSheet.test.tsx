import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import DatePickerSheet from './DatePickerSheet'

describe('DatePickerSheet Component', () => {
  it('renders day cells for the current month when visible', () => {
    const { getByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(getByTestId('date-picker-sheet')).toBeTruthy()
    // Feb 2026 has 28 days, so day 28 exists but 29 does not.
    expect(getByTestId('date-day-2026-02-05')).toBeTruthy()
  })

  it('pre-selects the initial date', () => {
    const { getByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(getByTestId('date-day-2026-02-05').props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('selects a day and confirms with the formatted value', () => {
    const onConfirm = jest.fn()
    const { getByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('date-day-2026-02-10'))
    fireEvent.press(getByTestId('date-confirm'))
    expect(onConfirm).toHaveBeenCalledWith('2026-02-10')
  })

  it('navigates to the previous month', () => {
    const { getByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('date-prev-month'))
    // January 2026 day 31 should now be visible.
    expect(getByTestId('date-day-2026-01-31')).toBeTruthy()
  })

  it('never renders Feb 30 in a non-leap year', () => {
    const { queryByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(queryByTestId('date-day-2026-02-29')).toBeNull()
    expect(queryByTestId('date-day-2026-02-30')).toBeNull()
    expect(queryByTestId('date-day-2026-02-28')).toBeTruthy()
  })

  it('calls onClose when backdrop pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(
      <DatePickerSheet
        visible={true}
        initialDate="2026-02-05"
        onConfirm={jest.fn()}
        onClose={onClose}
      />
    )
    fireEvent.press(getByTestId('date-picker-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})