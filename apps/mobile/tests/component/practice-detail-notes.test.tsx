import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PracticeDetailView } from '../../src/components/views/PracticeDetailView';
import { AppProvider } from '../../src/context/AppContext';
import { db } from '../../src/db/database';

// Mock navigation
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../../src/utils/hapticFeedback', () => ({
  HapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

jest.mock('react-native-gesture-handler', () => {
  const ReactLib = require('react');
  return {
    PanGestureHandler: ({ children }: any) => children,
    TapGestureHandler: ({ children }: any) => children,
    Swipeable: ({ children, renderRightActions }: any) =>
      ReactLib.createElement(
        ReactLib.Fragment,
        null,
        children,
        renderRightActions ? renderRightActions() : null
      ),
  };
});

describe('PracticeDetailView Notes & Heat Stress Action Levels', () => {
  const mockPractice = {
    id: 'practice-123',
    name: 'Test Practice',
    date: '2026-09-02',
    location: 'Main Field',
    coach: 'John Coach',
    sport: 'Soccer',
    contactInfo: 'john@example.com',
    headCoach: 'John Coach',
    teamId: 'team-1',
    notes: '',
    checklists: [],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    color: '#FF6B6B',
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  };

  const renderView = () =>
    render(
      <AppProvider>
        <PracticeDetailView navigation={mockNavigation} route={mockRoute} />
      </AppProvider>
    );

  beforeEach(async () => {
    jest.clearAllMocks();
    await db.teams.put({ ...mockTeam, _syncStatus: 'synced' });
    await db.practices.put({ ...mockPractice, _syncStatus: 'synced' });
  });

  afterAll(async () => {
    await db.teams.clear();
    await db.practices.clear();
    await db.syncQueue.clear();
  });

  test('renders an Additional Notes & Observations field', async () => {
    renderView();
    await screen.findByText(/Main Field/);
    expect(screen.getByText('Additional Notes & Observations')).toBeTruthy();
    expect(screen.getByLabelText('Additional notes and observations')).toBeTruthy();
  });

  test('renders all three Heat Stress Action Levels bands with guidance', async () => {
    renderView();
    await screen.findByText(/Main Field/);

    expect(screen.getByText('Heat Stress Action Levels')).toBeTruthy();
    expect(screen.getByText('80–89°F')).toBeTruthy();
    expect(screen.getByText('Encourage hydration, schedule rest breaks, provide shade.')).toBeTruthy();
    expect(screen.getByText('90–99°F')).toBeTruthy();
    expect(screen.getByText('Mandatory rest breaks (10 minutes per 2 hours), closely monitor employees.')).toBeTruthy();
    expect(screen.getByText('100+°F')).toBeTruthy();
    expect(screen.getByText('Increase breaks (15 minutes per hour), provide cooling measures (fans, shade, cool-down area).')).toBeTruthy();
  });

  test('saving notes dispatches an updated practice and reflects the text', async () => {
    renderView();
    await screen.findByText(/Main Field/);

    const input = screen.getByTestId('notes-input');
    fireEvent.changeText(input, 'Player showed heat symptoms');

    const saveButton = screen.getByTestId('save-notes-button');
    fireEvent.press(saveButton);

    await waitFor(async () => {
      const stored = await db.practices.get('practice-123');
      expect(stored?.notes).toContain('Player showed heat symptoms');
    });
  });

  test('displays persisted notes when the practice already has notes', async () => {
    await db.practices.put({ ...mockPractice, notes: 'Existing observation', _syncStatus: 'synced' });

    renderView();
    await screen.findByText(/Main Field/);

    expect(screen.getByTestId('notes-input').props.value).toBe('Existing observation');
  });
});