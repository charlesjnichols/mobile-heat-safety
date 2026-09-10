import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import TimePickerSheet from './TimePickerSheet'

describe('TimePickerSheet Component', () => {
  it('renders the sheet when visible', () => {
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(getByTestId('time-picker-sheet')).toBeTruthy()
    expect(getByTestId('time-hour-wheel')).toBeTruthy()
    expect(getByTestId('time-minute-wheel')).toBeTruthy()
  })

  it('pre-selects the initial time in 12-hour form with the correct period', () => {
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    // 14:30 → 2:30 PM
    expect(getByTestId('time-hour-2').props.accessibilityState).toEqual({
      selected: true,
    })
    expect(getByTestId('time-minute-30').props.accessibilityState).toEqual({
      selected: true,
    })
    expect(getByTestId('time-period-PM').props.accessibilityState).toEqual({
      selected: true,
    })
  })

  it('pre-selects AM for midnight and morning times', () => {
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="09:05"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(getByTestId('time-hour-9').props.accessibilityState).toEqual({
      selected: true,
    })
    expect(getByTestId('time-period-AM').props.accessibilityState).toEqual({
      selected: true,
    })
  })

it('selects an hour/minute/period and confirms with the 24-hour value', () => {
    const onConfirm = jest.fn()
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    )
    // Stay near the pre-selected 2:30 PM to avoid virtualization offscreen.
    fireEvent.press(getByTestId('time-hour-3'))
    fireEvent.press(getByTestId('time-minute-31'))
    fireEvent.press(getByTestId('time-confirm'))
    // 3:31 PM → 15:31 (current period stays PM)
    expect(onConfirm).toHaveBeenCalledWith('15:31')
  })

it('converts AM/PM back to 24-hour correctly', () => {
    const onConfirm = jest.fn()
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    )
    fireEvent.press(getByTestId('time-period-AM'))
    fireEvent.press(getByTestId('time-hour-2'))
    fireEvent.press(getByTestId('time-confirm'))
    // 2:30 AM → 02:30
    expect(onConfirm).toHaveBeenCalledWith('02:30')
  })

  it('bounds hour values to 1-12 and minute values to 00-59', () => {
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    )
    expect(getByTestId('time-hour-wheel').props.data.length).toBe(12)
    expect(getByTestId('time-minute-wheel').props.data.length).toBe(60)
  })

  it('calls onClose when backdrop pressed', () => {
    const onClose = jest.fn()
    const { getByTestId } = render(
      <TimePickerSheet
        visible={true}
        initialTime="14:30"
        onConfirm={jest.fn()}
        onClose={onClose}
      />
    )
    fireEvent.press(getByTestId('time-picker-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})