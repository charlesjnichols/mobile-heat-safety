import { render } from '@testing-library/react-native';

import { PracticeDetailView } from '../../src/components/views/PracticeDetailView';

// Mock the PracticeDetailView component
jest.mock('../../src/components/views/PracticeDetailView', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockPracticeDetailView = () => React.createElement(Text, null, 'Mock PracticeDetailView');
  return {
    __esModule: true,
    default: MockPracticeDetailView,
    PracticeDetailView: MockPracticeDetailView,
  };
});

test('Mock PracticeDetailView render test', () => {
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
    <PracticeDetailView 
      navigation={mockNavigation} 
      route={mockRoute} 
    />
  );
});