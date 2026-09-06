// AsyncStorage will be mocked
import * as FileSystem from 'expo-file-system';
import { calculateHeatIndex } from '../../src/utils/heatIndex';
import { loadData, getDefaultData } from '../../src/utils/storage';

const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for testing
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock FileSystem for testing
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///tmp/',
  getInfoAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

/**
 * Integration Test: Heat Index Calculation
 * 
 * Purpose: Validate that heat index calculations work correctly
 * across the entire application stack including:
 * - Input validation
 * - Calculation accuracy  
 * - Data persistence
 * - Mobile performance constraints
 * 
 * This test integrates:
 * - Frontend input components
 * - Heat index calculation utility
 * - Data storage layer
 * - Mobile performance requirements
 */

describe('Heat Index Calculation Integration', () => {
  
  // Use the actual heat index calculation utility from the app
  const mockStoredData = {
    version: "1.0.0",
    lastSync: "2026-09-02T10:00:00Z",
    data: {
      teams: [
        {
          id: "team-1",
          name: "Test Team",
          color: "#FF6B6B",
          createdAt: "2026-09-02T10:00:00Z",
          updatedAt: "2026-09-02T10:00:00Z"
        }
      ],
      practices: [
        {
          id: "practice-1",
          date: "2026-09-02",
          location: "Field A",
          headCoach: "John Coach",
          teamId: "team-1",
          checklists: [
            {
              id: "checklist-1",
              practiceId: "practice-1",
              time: "14:30",
              temperature: 85,
              humidity: 70,
              heatIndex: 92.7,
              actionTaken: "Water breaks every 20 minutes",
              timestamp: "2026-09-02T14:30:00Z",
              deviceInfo: "iPhone 12 Pro"
            },
            {
              id: "checklist-2", 
              practiceId: "practice-1",
              time: "15:00",
              temperature: 88,
              humidity: 75,
              heatIndex: 103.1,
              actionTaken: "Modified practice (reduced intensity)",
              timestamp: "2026-09-02T15:00:00Z",
              deviceInfo: "iPhone 12 Pro"
            }
          ],
          createdAt: "2026-09-02T10:00:00Z",
          updatedAt: "2026-09-02T15:00:00Z"
        }
      ]
    }
  };

  beforeEach(() => {
    // Reset mocks before each test
    (require('@react-native-async-storage/async-storage').getItem as jest.Mock).mockClear();
    (require('@react-native-async-storage/async-storage').setItem as jest.Mock).mockClear();
    (FileSystem.writeAsStringAsync as jest.Mock).mockClear();
    (FileSystem.readAsStringAsync as jest.Mock).mockClear();
  });

  describe('Heat Index Calculation Accuracy', () => {
    
    test('should calculate heat index using exact NWS formula', () => {
      const testCases = [
        { temp: 70, humidity: 50, expected: 76.9 },
        { temp: 80, humidity: 60, expected: 81.8 },
        { temp: 90, humidity: 70, expected: 105.9 },
        { temp: 95, humidity: 80, expected: 133.8 },
        { temp: 100, humidity: 40, expected: 109.3 },
        { temp: 110, humidity: 30, expected: 122.3 }
      ];

      testCases.forEach(({ temp, humidity, expected }) => {
        const result = calculateHeatIndex(temp, humidity);
        
        // Allow small rounding differences
        expect(Math.abs(result - expected)).toBeLessThanOrEqual(0.5);
      });
    });

    test('should handle boundary temperature values', () => {
      const boundaryCases = [
        { temp: 60, humidity: 0, expected: 60.0 },
        { temp: 60, humidity: 100, expected: 60.0 },
        { temp: 130, humidity: 0, expected: 130.0 },
        { temp: 130, humidity: 100, expected: 501.7 }
      ];

      boundaryCases.forEach(({ temp, humidity, expected }) => {
        const result = calculateHeatIndex(temp, humidity);
        expect(result).toBe(expected);
      });
    });

    test('should produce heat index >= temperature for all valid inputs', () => {
      for (let temp = 60; temp <= 130; temp += 5) {
        for (let humidity = 0; humidity <= 100; humidity += 10) {
          const heatIndex = calculateHeatIndex(temp, humidity);
          expect(heatIndex).toBeGreaterThanOrEqual(temp);
        }
      }
    });

    test('should calculate maximum heat index for practice', () => {
      const practice = mockStoredData.data.practices[0];
      const checklists = practice.checklists;
    
      const maxHeatIndex = Math.max(...checklists.map(c => c.heatIndex));
      const calculatedMax = Math.max(...checklists.map(c => calculateHeatIndex(c.temperature, c.humidity)));
      
      expect(calculatedMax).toBe(maxHeatIndex);
    });
  });

  describe('Mobile Performance Requirements', () => {
    
    test('should complete calculation in <20ms on mobile devices', () => {
      const startTime = performance.now();
      
      // Perform multiple calculations to simulate real usage
      for (let i = 0; i < 100; i++) {
        calculateHeatIndex(80 + Math.random() * 40, 30 + Math.random() * 60);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // 100 calculations in <2s = <20ms per calculation
    });

    test('should handle rapid input changes without lag', () => {
      const iterations = 50;
      const startTimes: number[] = [];
      const endTimes: number[] = [];
      
      // Simulate rapid temperature/humidity input changes
      for (let i = 0; i < iterations; i++) {
        startTimes.push(performance.now());
        
        // Simulate user typing rapidly
        const temp = 70 + Math.random() * 50;
        const humidity = 20 + Math.random() * 70;
        calculateHeatIndex(temp, humidity);
        
        endTimes.push(performance.now());
      }
      
      // Check that individual calculations are fast
      const individualTimes = endTimes.map((end, i) => end - startTimes[i]);
      const maxIndividualTime = Math.max(...individualTimes);
      
      expect(maxIndividualTime).toBeLessThan(50); // Individual calc <50ms
    });
  });

  describe('Data Integration with the read-only storage layer', () => {
    test('loads and validates heat index data', async () => {
      // Mock AsyncStorage returning data with heat indices
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockStoredData));

      const data = await loadData();
      expect(data).toBeDefined();

      data.data.practices.forEach(practice => {
        practice.checklists.forEach(checklist => {
          const calculated = calculateHeatIndex(checklist.temperature, checklist.humidity);
          expect(checklist.heatIndex).toBe(calculated);
        });
      });
    });

    test('round-trips heat index data through read-only loadData without writing', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockStoredData));

      await loadData();

      // The storage layer must be read-only: no write may occur.
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    test('returns default data gracefully when AsyncStorage fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const data = await loadData();

      expect(data).toEqual(getDefaultData());
    });
  });

  describe('Real-time Calculation Integration', () => {
    
    test('should provide immediate feedback during form input', () => {
      // Simulate user typing in temperature and humidity fields
      const temperatureInputs = [70, 75, 80, 85, 90];
      const humidityInputs = [50, 60, 70, 80, 90];
      
      const feedback: { temp: number; humidity: number; heatIndex: number }[] = [];
      
      temperatureInputs.forEach((temp, i) => {
        const humidity = humidityInputs[i];
        const heatIndex = calculateHeatIndex(temp, humidity);
        
        feedback.push({
          temp,
          humidity,
          heatIndex
        });
        
        // Simulate UI update (this should be fast)
        expect(heatIndex).toBeGreaterThanOrEqual(temp);
      });
      
      expect(feedback.length).toBe(5);
    });

    test('should update heat index when either temperature or humidity changes', () => {
      const baseTemp = 80;
      const baseHumidity = 60;
      const baseHeatIndex = calculateHeatIndex(baseTemp, baseHumidity);
      
      // Test temperature changes
      const tempVariations = [75, 85, 90];
      tempVariations.forEach(temp => {
        const newHeatIndex = calculateHeatIndex(temp, baseHumidity);
        expect(newHeatIndex).not.toBe(baseHeatIndex);
        expect(newHeatIndex).toBeGreaterThanOrEqual(temp);
      });
      
      // Test humidity changes  
      const humidityVariations = [50, 70, 80];
      humidityVariations.forEach(humidity => {
        const newHeatIndex = calculateHeatIndex(baseTemp, humidity);
        expect(newHeatIndex).not.toBe(baseHeatIndex);
        expect(newHeatIndex).toBeGreaterThanOrEqual(baseTemp);
      });
    });

    test('should handle edge cases in real-time calculation', () => {
      const edgeCases = [
        { temp: 60, humidity: 0, description: 'minimum temp, minimum humidity' },
        { temp: 130, humidity: 100, description: 'maximum temp, maximum humidity' },
        { temp: 80, humidity: 0, description: 'normal temp, minimum humidity' },
        { temp: 80, humidity: 100, description: 'normal temp, maximum humidity' },
      ];
      
      edgeCases.forEach(({ temp, humidity, description }) => {
        const heatIndex = calculateHeatIndex(temp, humidity);
        
        // Should not crash on edge cases
        expect(typeof heatIndex).toBe('number');
        expect(isFinite(heatIndex)).toBe(true);
        expect(heatIndex).toBeGreaterThanOrEqual(temp);
      });
    });
  });

  describe('Risk Level Integration', () => {
    
    const getRiskLevel = (heatIndex: number): { level: string; color: string } => {
      if (heatIndex < 80) return { level: 'LOW', color: '#4CAF50' };
      if (heatIndex < 90) return { level: 'MODERATE', color: '#FFC107' };
      if (heatIndex < 105) return { level: 'HIGH', color: '#FF5722' };
      return { level: 'EXTREME', color: '#9C27B0' };
    };

    test('should correctly map heat index to risk levels', () => {
      const testCases = [
        { heatIndex: 75, expectedLevel: 'LOW', expectedColor: '#4CAF50' },
        { heatIndex: 85, expectedLevel: 'MODERATE', expectedColor: '#FFC107' },
        { heatIndex: 95, expectedLevel: 'HIGH', expectedColor: '#FF5722' },
        { heatIndex: 110, expectedLevel: 'EXTREME', expectedColor: '#9C27B0' }
      ];

      testCases.forEach(({ heatIndex, expectedLevel, expectedColor }) => {
        const risk = getRiskLevel(heatIndex);
        expect(risk.level).toBe(expectedLevel);
        expect(risk.color).toBe(expectedColor);
      });
    });

    test('should provide risk color coding for practice summaries', () => {
      const practice = mockStoredData.data.practices[0];
      const maxHeatIndex = Math.max(...practice.checklists.map(c => c.heatIndex));
      const risk = getRiskLevel(maxHeatIndex);
      
      expect(['LOW', 'MODERATE', 'HIGH', 'EXTREME']).toContain(risk.level);
      expect(risk.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
    });
  });

  describe('Export/Import Integration', () => {
    
    test('should export heat index data with calculated values', async () => {
      const exportData = {
        ...mockStoredData,
        exportedAt: new Date().toISOString(),
        exportNotes: 'Heat safety data export'
      };
      
      // Mock file system operations
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      
      await FileSystem.writeAsStringAsync(
        `${FileSystem.documentDirectory}heat-safety-export.json`,
        JSON.stringify(exportData, null, 2)
      );
      
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      
      // Verify exported data contains calculated heat indices
      const exportedString = JSON.stringify(exportData, null, 2);
      const exported = JSON.parse(exportedString);
      
      exported.data.practices.forEach((practice: any) => {
        practice.checklists.forEach((checklist: any) => {
          expect(checklist.heatIndex).toBeDefined();
          expect(typeof checklist.heatIndex).toBe('number');
        });
      });
    });

    test('should import and validate heat index data', async () => {
      const importData = {
        ...mockStoredData,
        importedAt: new Date().toISOString()
      };
      
      // Mock reading file
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(importData));
      
      const fileContent = await FileSystem.readAsStringAsync(
        `${FileSystem.documentDirectory}heat-safety-import.json`
      );
      
      expect(fileContent).toBeDefined();
      
      const imported = JSON.parse(fileContent);
      
      // Validate all heat indices are correct
      imported.data.practices.forEach((practice: any) => {
        practice.checklists.forEach((checklist: any) => {
          const calculated = calculateHeatIndex(checklist.temperature, checklist.humidity);
          expect(checklist.heatIndex).toBe(calculated);
        });
      });
    });
  });
});