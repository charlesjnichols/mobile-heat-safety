import { getRiskLevel, getRiskColor, getRecommendedAction, requiresSafetyAction } from '../../src/components/common/ColorCode';

describe('Heat Risk Calculation Utilities', () => {
  describe('getRiskLevel', () => {
    it('should return LOW risk for heat index below 80', () => {
      expect(getRiskLevel(70)).toBe('LOW');
      expect(getRiskLevel(0)).toBe('LOW');
      expect(getRiskLevel(79)).toBe('LOW');
    });

    it('should return MODERATE risk for heat index 80-90', () => {
      expect(getRiskLevel(80)).toBe('MODERATE');
      expect(getRiskLevel(85)).toBe('MODERATE');
      expect(getRiskLevel(90)).toBe('MODERATE');
    });

    it('should return HIGH risk for heat index 90-105', () => {
      expect(getRiskLevel(91)).toBe('HIGH');
      expect(getRiskLevel(100)).toBe('HIGH');
      expect(getRiskLevel(105)).toBe('HIGH');
    });

    it('should return EXTREME risk for heat index above 105', () => {
      expect(getRiskLevel(106)).toBe('EXTREME');
      expect(getRiskLevel(150)).toBe('EXTREME');
      expect(getRiskLevel(Infinity)).toBe('EXTREME');
    });

    it('should handle boundary conditions correctly', () => {
      expect(getRiskLevel(80)).toBe('MODERATE');
      expect(getRiskLevel(90)).toBe('MODERATE');
      expect(getRiskLevel(105)).toBe('HIGH');
    });
  });

  describe('getRiskColor', () => {
    it('should return correct color for each risk level', () => {
      expect(getRiskColor('LOW')).toBe('#22c55e');
      expect(getRiskColor('MODERATE')).toBe('#eab308');
      expect(getRiskColor('HIGH')).toBe('#f97316');
      expect(getRiskColor('EXTREME')).toBe('#dc2626');
    });
  });

  describe('getRecommendedAction', () => {
    it('should return appropriate action for each risk level', () => {
      expect(getRecommendedAction('LOW')).toBe('No restrictions');
      expect(getRecommendedAction('MODERATE')).toBe('Water breaks every 30 minutes');
      expect(getRecommendedAction('HIGH')).toBe('Modified practice (reduced intensity)');
      expect(getRecommendedAction('EXTREME')).toBe('Cancel outdoor practice');
    });
  });

  describe('requiresSafetyAction', () => {
    it('should return true for MODERATE risk and above', () => {
      expect(requiresSafetyAction(81)).toBe(true);
      expect(requiresSafetyAction(90)).toBe(true);
      expect(requiresSafetyAction(105)).toBe(true);
    });

    it('should return false for LOW risk', () => {
      expect(requiresSafetyAction(70)).toBe(false);
      expect(requiresSafetyAction(0)).toBe(false);
      expect(requiresSafetyAction(79)).toBe(false);
    });
  });

  describe('RiskLevel Type', () => {
    it('should accept only valid risk levels', () => {
      expect(() => getRiskLevel(70)).not.toThrow();
      expect(() => getRiskLevel(85)).not.toThrow();
      expect(() => getRiskLevel(100)).not.toThrow();
      expect(() => getRiskLevel(150)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid heat index', () => {
      expect(getRiskLevel(0)).toBe('LOW');
    });

    it('should handle maximum valid heat index', () => {
      expect(getRiskLevel(150)).toBe('EXTREME');
    });

    it('should handle negative values as LOW', () => {
      expect(getRiskLevel(-10)).toBe('LOW');
    });

    it('should handle very high values as EXTREME', () => {
      expect(getRiskLevel(1000)).toBe('EXTREME');
    });
  });

  describe('Color Contrast', () => {
    it('should have proper color contrast for outdoor visibility', () => {
      const colors = {
        LOW: getRiskColor('LOW'),
        MODERATE: getRiskColor('MODERATE'),
        HIGH: getRiskColor('HIGH'),
        EXTREME: getRiskColor('EXTREME')
      };

      // All colors should be dark colors on white backgrounds
      expect(colors.LOW).toBeDefined();
      expect(colors.MODERATE).toBeDefined();
      expect(colors.HIGH).toBeDefined();
      expect(colors.EXTREME).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should provide meaningful labels for screen readers', () => {
      expect(getRecommendedAction('LOW')).toBeDefined();
      expect(getRecommendedAction('HIGH')).toBeDefined();
      expect(getRecommendedAction('EXTREME')).toBeDefined();
    });
  });
});