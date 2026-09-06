import React from 'react';
import { render } from '@testing-library/react-native';
import SimpleComponent from './SimpleComponent';

test('Simple component test', () => {
  render(<SimpleComponent />);
});