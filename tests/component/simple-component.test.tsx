import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SimpleComponent from './SimpleComponent';
import { TeamForm } from '../../src/components/forms/TeamForm';

test('Simple component test', () => {
  render(<SimpleComponent />);
});

describe('TeamForm Accessibility', () => {
  it('should expose a human-readable color name label instead of a raw hex code', () => {
    const { getByLabelText } = render(
      <TeamForm
        existingTeamNames={[]}
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    expect(getByLabelText('Select color Coral Red')).toBeDefined();
    expect(getByLabelText('Select color Teal')).toBeDefined();
  });

  it('should call onSubmit only on valid submit', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <TeamForm
        existingTeamNames={[]}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    fireEvent.press(getByText('Save Team'));
    // Name is required; empty name should not submit.
    expect(onSubmit).not.toHaveBeenCalled();
  });
});