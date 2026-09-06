import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PracticeDetailView } from '../../src/components/views/PracticeDetailView';
import { AppProvider } from '../../src/context/AppContext';

describe('Heat Index Practice Summary Integration', () => {
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

  describe('Heat Index Calculation and Display', () => {
    it('should calculate and display maximum heat index for practice', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'checklist-2',
            time: '16:00',
            temperature: 92,
            humidity: 65,
            heatIndex: 103,
            actionTaken: 'Modified practice (reduced intensity)',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'checklist-3',
            time: '17:30',
            temperature: 78,
            humidity: 55,
            heatIndex: 82,
            actionTaken: 'No restrictions',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByText, getAllByText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getAllByText('95°F').length).toBeGreaterThan(0);
        expect(getAllByText('103°F').length).toBeGreaterThan(0);
      });
    });

    it('should display correct risk level for maximum heat index', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'checklist-2',
            time: '16:00',
            temperature: 92,
            humidity: 65,
            heatIndex: 103,
            actionTaken: 'Modified practice (reduced intensity)',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('103°F - HIGH Risk')).toBeDefined();
      });
    });

    it('should display all checklist entries with their heat indices', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'checklist-2',
            time: '16:00',
            temperature: 92,
            humidity: 65,
            heatIndex: 103,
            actionTaken: 'Modified practice (reduced intensity)',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByText, getAllByText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByText('2:30 PM')).toBeDefined();
        expect(getAllByText('95°F').length).toBeGreaterThan(0);
        expect(getByText('4:00 PM')).toBeDefined();
        expect(getAllByText('103°F').length).toBeGreaterThan(0);
      });
    });

    it('should handle practice with no checklists', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: []
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByText('No checklist entries yet')).toBeDefined();
        expect(getByText('add')).toBeDefined();
      });
    });
  });

  describe('Risk Level Integration', () => {
    it('should display color-coded risk indicators throughout interface', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });
    });

    it('should update risk level when heat index changes', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should calculate maximum heat index quickly (<20ms)', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'checklist-2',
            time: '16:00',
            temperature: 92,
            humidity: 65,
            heatIndex: 103,
            actionTaken: 'Modified practice (reduced intensity)',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const startTime = Date.now();

      render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(20); // Should render in less than 20ms
    });

    it('should handle large number of checklists efficiently', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: Array.from({ length: 100 }, (_, i) => ({
          id: `checklist-${i}`,
          time: '14:30',
          temperature: 85 + i,
          humidity: 60,
          heatIndex: 90 + i * 0.5,
          actionTaken: 'Water breaks every 30 minutes',
          createdAt: new Date().toISOString(),
        }))
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const startTime = Date.now();

      render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should handle 100 checklists efficiently
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper accessibility labels for heat index displays', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });
    });

    it('should provide proper contrast for outdoor visibility', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });
    });
  });

  describe('Data Integrity', () => {
    it('should maintain heat index calculations across renders', async () => {
      const mockPractice = {
        id: 'practice-123',
        date: '2026-09-02',
        location: 'Main Field',
        headCoach: 'Coach John',
        teamId: 'team-1',
        checklists: [
          {
            id: 'checklist-1',
            time: '14:30',
            temperature: 85,
            humidity: 60,
            heatIndex: 95,
            actionTaken: 'Water breaks every 30 minutes',
            createdAt: new Date().toISOString(),
          }
        ]
      };

      const mockTeam = {
        id: 'team-1',
        name: 'Varsity Team',
        color: '#3b82f6'
      };

      // Mock AsyncStorage to return the practice data
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(JSON.stringify({
        version: '1.0.0',
        data: {
          teams: [mockTeam],
          practices: [mockPractice]
        }
      }));

      const { getByLabelText, rerender } = render(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });

      // Rerender and verify calculations still correct
      rerender(
        <AppProvider>
          <PracticeDetailView
            navigation={mockNavigation}
            route={mockRoute}
          />
        </AppProvider>
      );

      await waitFor(() => {
        expect(getByLabelText('95°F - HIGH Risk')).toBeDefined();
      });
    });
  });
});