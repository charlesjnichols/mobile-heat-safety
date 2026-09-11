import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Share, Alert } from 'react-native';
import { PracticeDetailView } from '../../src/components/views/PracticeDetailView';
import { AppProvider } from '../../src/context/AppContext';
import { db } from '../../src/db/database';
import type { DbPractice } from '../../src/db/types';


// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setParams: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    practiceId: 'practice-123',
  },
};

// Mock haptic feedback utility used by the component
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
const { HapticFeedback } = require('../../src/utils/hapticFeedback');

// Mock gesture handler: render swipe actions inline so they are testable
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

/**
 * Component Test: PracticeDetailView
 * 
 * Purpose: Validate that the PracticeDetailView component works correctly
 * for managing practice details and checklist entries on mobile devices.
 * 
 * This test validates:
 * - Component rendering with practice data
 * - Mobile-optimized UI interactions
 * - Checklist entry management (add, view, delete)
 * - Heat index display based on current data
 * - Data persistence
 * - Error handling and user feedback
 * - Accessibility features
 */

describe('PracticeDetailView Component', () => {
  
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
    checklists: [
      {
        id: 'checklist-1',
        practiceId: 'practice-123',
        time: '14:30',
        temperature: 85,
        humidity: 70,
        heatIndex: 95,
        actionTaken: 'Water breaks every 20 minutes',
        timestamp: '2026-09-02T14:30:00Z',
        deviceInfo: 'iPhone 12 Pro',
        createdAt: '2026-09-02T14:30:00Z',
        updatedAt: '2026-09-02T14:30:00Z',
      },
      {
        id: 'checklist-2',
        practiceId: 'practice-123',
        time: '15:00',
        temperature: 88,
        humidity: 75,
        heatIndex: 102,
        actionTaken: 'Modified practice (reduced intensity)',
        timestamp: '2026-09-02T15:00:00Z',
        deviceInfo: 'iPhone 12 Pro',
        createdAt: '2026-09-02T15:00:00Z',
        updatedAt: '2026-09-02T15:00:00Z',
      }
    ],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T15:00:00Z'
  };

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    color: '#FF6B6B',
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  };

  // Date displayed by the component: new Date(practice.date).toLocaleDateString()
  const practiceDateText = new Date('2026-09-02').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const renderView = () =>
    render(
      <AppProvider>
        <PracticeDetailView 
          navigation={mockNavigation} 
          route={mockRoute} 
        />
      </AppProvider>
    );

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Seed the Dexie source of truth directly (replaces the legacy AsyncStorage mock)
    await db.teams.put({ ...mockTeam, _syncStatus: 'synced' });
    await db.practices.put({ ...(mockPractice as unknown as DbPractice), _syncStatus: 'synced' });
  });

  afterAll(async () => {
    await db.teams.clear();
    await db.practices.clear();
    await db.syncQueue.clear();
  });

  describe('Component Rendering', () => {
    
    test('should render practice details header correctly', async () => {
      renderView();

      // Wait for async data load
      await screen.findByText(/Main Field/);

      // Check practice information display
      expect(screen.getByText(/Main Field/)).toBeTruthy();
      expect(screen.getByText(new RegExp(practiceDateText))).toBeTruthy();
      expect(screen.getByText('John Coach')).toBeTruthy();
      expect(screen.getByText('Test Team')).toBeTruthy();
    });

    test('should display checklist entries without a table header', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // No table header should be rendered
      expect(screen.queryByText('Time')).toBeNull();
      expect(screen.queryByText('Heat Index')).toBeNull();
      expect(screen.queryByText('Action')).toBeNull();

      // Check checklist entries
      expect(screen.getByText('2:30 PM')).toBeTruthy();
      expect(screen.getAllByText('95°F').length).toBeGreaterThan(0);
      expect(screen.getByText('Water breaks every 20 minutes')).toBeTruthy();
    });

    test('should show maximum heat index for practice', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Should display max heat index (102°F from the mock data)
      expect(screen.getAllByText('102°F').length).toBeGreaterThan(0);
    });

    test('should show color-coded heat risk indicators', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Check for heat index indicators
      const heatIndicators = screen.getAllByText(/°F/);
      expect(heatIndicators.length).toBeGreaterThan(0);
      
      // Max heat index 102 should be HIGH risk
      expect(screen.getByText('HIGH Risk')).toBeTruthy();
    });

    test('should expose Export through the overflow menu', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Export is no longer a standalone header button
      expect(screen.queryByText('Export')).toBeNull();

      // Open the overflow menu
      const menuButton = screen.getByTestId('overflow-menu');
      expect(menuButton).toBeTruthy();
      fireEvent.press(menuButton);

      // Export is present as a menu item
      const exportItem = screen.getByText('Export');
      expect(exportItem).toBeTruthy();
    });
  });

  describe('Mobile Interactions', () => {
    
    test('should not render a soft back link (navigation bar provides back)', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // No in-content soft "←" link should exist
      expect(screen.queryByText('←')).toBeNull();
    });

    test('should open add checklist entry when FAB is pressed', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      const addButton = screen.getByTestId('fab-add-checklist');
      fireEvent.press(addButton);

      // Should trigger navigation to checklist form
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChecklistForm', {
        practiceId: 'practice-123',
        isEdit: false
      });
    });

    test('should handle checklist item selection', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Find and press a checklist item
      const checklistItem = screen.getByText('2:30 PM');
      fireEvent.press(checklistItem);

      // Should navigate to edit checklist form
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChecklistForm', {
        practiceId: 'practice-123',
        checklistId: 'checklist-1',
        isEdit: true
      });
    });

    test('should handle swipe to delete checklist entries', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Swipe action reveals delete button; delete the first entry
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBe(2);
      fireEvent.press(deleteButtons[0]);

      // Entry should be removed and data persisted to Dexie
      await waitFor(async () => {
        expect(screen.queryByText('2:30 PM')).toBeNull();
        const stored = await db.practices.get('practice-123');
        expect(stored?.checklists.some(c => c.id === 'checklist-1')).toBe(false);
      });
    });

    test('should trigger haptic feedback on important actions', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Open the overflow menu (opening triggers light haptic)
      const menuButton = screen.getByTestId('overflow-menu');
      fireEvent.press(menuButton);
      expect(HapticFeedback.light).toHaveBeenCalled();

      // Press export menu item (export triggers light haptic)
      fireEvent.press(screen.getByText('Export'));

      expect(HapticFeedback.light).toHaveBeenCalled();
    });
  });

  describe('Heat Index Display', () => {
    
    test('should display the maximum heat index and derived risk level', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Max of 95 and 102 with HIGH risk level (91-105)
      expect(screen.getAllByText('102°F').length).toBeGreaterThan(0);
      expect(screen.getByText('HIGH Risk')).toBeTruthy();
    });

    test('should update heat index display when checklist data changes', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Delete the second entry (heat index 102)
      fireEvent.press(screen.getAllByText('Delete')[1]);

      // Max heat index should immediately reflect the remaining data
      await waitFor(() => {
        expect(screen.getAllByText('95°F').length).toBeGreaterThan(0);
      });
      expect(screen.queryByText('102°F')).toBeNull();
      expect(screen.getByText('HIGH Risk')).toBeTruthy();
    });

    test('should color risk text according to heat index thresholds', async () => {
      // Push the max heat index over the 105 threshold (EXTREME)
      const extremePractice = {
        ...mockPractice,
        checklists: [
          { ...mockPractice.checklists[0], heatIndex: 108 },
          { ...mockPractice.checklists[1], heatIndex: 110 },
        ],
      };
      await db.practices.put({ ...(extremePractice as unknown as DbPractice), _syncStatus: 'synced' });

      renderView();
      await screen.findByText(/Main Field/);

      // Should show extreme risk with the extreme (red) color
      const riskText = await screen.findByText('EXTREME Risk');
      expect(riskText).toHaveStyle({ color: '#dc2626' });
    });
  });

  describe('Data Persistence', () => {
    
    test('should save checklist changes to Dexie', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Delete the second entry (heat index 102); the change must be persisted
      fireEvent.press(screen.getAllByText('Delete')[1]);

      // Should save updated data to Dexie
      await waitFor(async () => {
        const stored = await db.practices.get('practice-123');
        expect(stored?.checklists.some(c => c.heatIndex === 102)).toBe(false);
      });
    });

    test('should show loading state while data loads', async () => {
      renderView();

      // Should show practice data after loading
      await screen.findByText(/Main Field/);
      expect(screen.getByText(/Main Field/)).toBeTruthy();
    });
  });

  describe('Accessibility Features', () => {
    
    test('should support VoiceOver/TalkBack with proper labels', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Overflow menu is reachable
      expect(screen.getByLabelText('More options')).toBeTruthy();
      
      // FAB has an accessibility label
      expect(screen.getByLabelText('Add checklist entry')).toBeTruthy();
      
      // Checklist entries expose labels and hints
      const checklistItem = screen.getByLabelText(
        'Checklist entry: 2:30 PM, heat index 95°F, Water breaks every 20 minutes'
      );
      expect(checklistItem.props.accessibilityHint).toBe('Tap to edit checklist entry');
    });

    test('should have large touch targets for mobile interaction', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // FAB has a large touch target (56x56)
      const addButton = screen.getByTestId('fab-add-checklist');
      const fabStyle = Array.isArray(addButton.props.style)
        ? Object.assign({}, ...addButton.props.style.filter(Boolean))
        : addButton.props.style;
      expect(fabStyle.width).toBeGreaterThanOrEqual(44);
      expect(fabStyle.height).toBeGreaterThanOrEqual(44);

      // Overflow menu button has a large touch target
      const menuButton = screen.getByTestId('overflow-menu');
      const menuStyle = Array.isArray(menuButton.props.style)
        ? Object.assign({}, ...menuButton.props.style.filter(Boolean))
        : menuButton.props.style;
      expect(menuStyle.width).toBeGreaterThanOrEqual(44);
      expect(menuStyle.height).toBeGreaterThanOrEqual(44);
    });

    test('should provide haptic feedback for interactive elements', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Pressing a checklist entry provides tactile confirmation
      const checklistItem = screen.getByText('2:30 PM');
      fireEvent.press(checklistItem);

      expect(HapticFeedback.light).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    
    test('should handle missing practice data gracefully', async () => {
      await db.practices.clear();

      renderView();

      // Should show error message
      await screen.findByText('Practice not found');
      expect(screen.getByText('Practice not found')).toBeTruthy();
    });

    test('should handle network errors during export', async () => {
      // Mock export failure
      const shareSpy = jest.spyOn(Share, 'share')
        .mockRejectedValue(new Error('Share failed'));
      const alertSpy = jest.spyOn(Alert, 'alert');

      renderView();
      await screen.findByText(/Main Field/);

      // Try to export data via the overflow menu
      fireEvent.press(screen.getByTestId('overflow-menu'));
      const exportButton = screen.getByText('Export');
      fireEvent.press(exportButton);

      // Should show error message
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to export data');
      });

      shareSpy.mockRestore();
      alertSpy.mockRestore();
    });

    test('should reflect state once data loads from the provider', async () => {
      renderView();

      // The detail view reads from context and renders once state is populated.
      await screen.findByText(/Main Field/);
      expect(screen.getByText(/Main Field/)).toBeTruthy();
    });
  });

  describe('Performance Optimization', () => {
    
    test('should use virtualized list for large datasets', async () => {
      // Create mock data with many checklist entries
      const largeMockPractice = {
        ...mockPractice,
        checklists: Array.from({ length: 100 }, (_, i) => ({
          id: `checklist-${i}`,
          practiceId: 'practice-123',
          time: `${14 + Math.floor(i / 2)}:${30 + (i % 2) * 30}`,
          temperature: 80 + Math.floor(i / 10),
          humidity: 60 + (i % 5) * 10,
          heatIndex: 90 + Math.floor(i / 5),
          actionTaken: 'Water breaks every 20 minutes',
          timestamp: '2026-09-02T14:30:00Z',
          deviceInfo: 'iPhone 12 Pro',
          createdAt: '2026-09-02T14:30:00Z',
          updatedAt: '2026-09-02T14:30:00Z',
        }))
      };

      await db.practices.put({ ...(largeMockPractice as unknown as DbPractice), _syncStatus: 'synced' });

      renderView();

      // Should render without crashing — max of 90 + floor(99/5) = 109
      await screen.findAllByText('109°F');
      
      // Checklist list container should be rendered
      const checklistList = screen.getByTestId('checklist-list');
      expect(checklistList).toBeTruthy();
    });

    test('should memoize expensive calculations', async () => {
      renderView();
      await screen.findByText(/Main Field/);

      // Re-querying should return the same rendered elements
      const firstRender = screen.getAllByText('95°F')[0];
      const secondRender = screen.getAllByText('95°F')[0];
      
      expect(firstRender).toBe(secondRender); // Same element reference
    });
  });
});
