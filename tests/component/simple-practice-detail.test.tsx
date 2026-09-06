import React from 'react';
import { render } from '@testing-library/react-native';
import { PracticeDetailView } from '../../src/components/views/PracticeDetailView';
import { AppProvider } from '../../src/context/AppContext';

test('Simple PracticeDetailView render test', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  };

  const mockRoute = {
    params: {
      practiceId: 'practice-123',
    },
  };

  render(
    <AppProvider>
      <PracticeDetailView 
        navigation={mockNavigation} 
        route={mockRoute} 
      />
    </AppProvider>
  );
});