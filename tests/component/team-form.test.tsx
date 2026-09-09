import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { TeamForm } from '../../src/components/forms/TeamForm'

describe('TeamForm Component', () => {
  const existingTeamNames = ['Varsity Team', 'JV Team']

  it('renders with default props', () => {
    const { getByLabelText, getByText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={jest.fn()} onCancel={jest.fn()} />
    )

    expect(getByText('Add New Team')).toBeTruthy()
    expect(getByLabelText('Team name input')).toBeTruthy()
    expect(getByLabelText('Save Team')).toBeTruthy()
  })

  it('calls onSubmit with valid name and color', () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={onSubmit} onCancel={jest.fn()} />
    )

    fireEvent.changeText(getByLabelText('Team name input'), 'Freshman Team')
    fireEvent.press(getByLabelText('Save Team'))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Freshman Team',
      color: '#FF6B6B',
    })
  })

  it('shows an error and does not submit for a duplicate name', () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={onSubmit} onCancel={jest.fn()} />
    )

    fireEvent.changeText(getByLabelText('Team name input'), 'Varsity Team')
    fireEvent.press(getByLabelText('Save Team'))

    expect(getByText('Team name must be unique')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel is pressed', () => {
    const onCancel = jest.fn()
    const { getByLabelText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={jest.fn()} onCancel={onCancel} />
    )

    fireEvent.press(getByLabelText('Cancel team form'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('selects a color when a swatch is tapped', () => {
    const { getByLabelText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={jest.fn()} onCancel={jest.fn()} />
    )

    fireEvent.press(getByLabelText('Select color Sky Blue'))
    expect(getByLabelText('Team color preview #45B7D1')).toBeTruthy()
  })

  it('exposes human-readable color names for accessibility', () => {
    const { getByLabelText } = render(
      <TeamForm existingTeamNames={existingTeamNames} onSubmit={jest.fn()} onCancel={jest.fn()} />
    )

    expect(getByLabelText('Select color Coral Red')).toBeTruthy()
    expect(getByLabelText('Select color Teal')).toBeTruthy()
  })
})
