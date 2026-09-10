import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import TeamPickerSheet from './TeamPickerSheet'
import { Team } from '../../types'

const teams: Team[] = [
  { id: 't1', name: 'Zebra Team', color: '#22c55e', createdAt: '', updatedAt: '' },
  { id: 't2', name: 'Alpha Team', color: '#eab308', createdAt: '', updatedAt: '' },
  { id: 't3', name: 'Marlin Team', color: '#f97316', createdAt: '', updatedAt: '' },
]

describe('TeamPickerSheet Component', () => {
  it('renders the empty state when there are no teams', () => {
    const { getByText } = render(
      <TeamPickerSheet
        teams={[]}
        selectedTeamId=""
        visible={true}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(getByText('Create a team first')).toBeTruthy()
    expect(getByText('Create a team')).toBeTruthy()
  })

  it('renders team names sorted alphabetically', () => {
    const { getAllByText } = render(
      <TeamPickerSheet
        teams={teams}
        selectedTeamId=""
        visible={true}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(getAllByText('Alpha Team')).toBeTruthy()
    const sorted = ['Alpha Team', 'Marlin Team', 'Zebra Team']
    sorted.forEach(name => {
      expect(getAllByText(name).length).toBeGreaterThan(0)
    })
  })

  it('calls onSelect with the tapped team id', () => {
    const onSelect = jest.fn()
    const { getByLabelText } = render(
      <TeamPickerSheet
        teams={teams}
        selectedTeamId=""
        visible={true}
        onSelect={onSelect}
        onClose={jest.fn()}
      />
    )

    fireEvent.press(getByLabelText('Alpha Team'))
    expect(onSelect).toHaveBeenCalledWith('t2')
  })

  it('marks the selected row as selected', () => {
    const { getByLabelText } = render(
      <TeamPickerSheet
        teams={teams}
        selectedTeamId="t2"
        visible={true}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(getByLabelText('Alpha Team').props.accessibilityState).toEqual({ selected: true })
  })

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn()
    const { getAllByLabelText } = render(
      <TeamPickerSheet
        teams={teams}
        selectedTeamId=""
        visible={true}
        onSelect={jest.fn()}
        onClose={onClose}
      />
    )

    fireEvent.press(getAllByLabelText('Close team selector')[0])
    expect(onClose).toHaveBeenCalled()
  })
})