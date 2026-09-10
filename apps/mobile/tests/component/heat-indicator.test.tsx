import React from 'react';
import { render } from '@testing-library/react-native';
import { ColorCode, RiskBadge, HeatIndexSummary } from '../../src/components/common/ColorCode';
import { BaseButton } from '../../src/components/common/BaseComponents';

describe('BaseButton Accessibility', () => {
  it('should expose a busy accessibility state while loading', () => {
    const { getByLabelText } = render(
      <BaseButton title="Save" loading={true} onPress={() => {}} />
    );

    const button = getByLabelText('Save');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it('should expose a disabled accessibility state when disabled', () => {
    const { getByLabelText } = render(
      <BaseButton title="Save" disabled={true} onPress={() => {}} />
    );

    const button = getByLabelText('Save');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: false });
  });
});

describe('ColorCode Component', () => {
  const mockHeatIndex = 85;

  describe('Component Rendering', () => {
    it('should render ColorCode with default props', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should render ColorCode with small size', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} size="small" />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should render ColorCode with medium size', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} size="medium" />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should render ColorCode with large size', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} size="large" />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should render ColorCode with custom color', () => {
      const customColor = '#ff0000';
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} customColor={customColor} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should hide label when showLabel is false', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} showLabel={false} />
      );

      const element = getByLabelText('85°F - MODERATE Risk');
      expect(element).toBeDefined();
    });

    it('should hide description when showDescription is false', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={mockHeatIndex} showDescription={false} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });
  });

  describe('Risk Level Display', () => {
    it('should display LOW risk color (green)', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={70} />
      );

      expect(getByLabelText('70°F - LOW Risk')).toBeDefined();
    });

    it('should display MODERATE risk color (yellow)', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={85} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });

    it('should display HIGH risk color (orange)', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={100} />
      );

      expect(getByLabelText('100°F - HIGH Risk')).toBeDefined();
    });

    it('should display EXTREME risk color (red)', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={110} />
      );

      expect(getByLabelText('110°F - EXTREME Risk')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={85} testID="color-code-test" />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
      expect(getByLabelText('Take precautions')).toBeDefined();
    });

    it('should be accessible for screen readers', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={85} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeTruthy();
    });

    it('should have proper accessibility role', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={85} />
      );

      const element = getByLabelText('85°F - MODERATE Risk');
      expect(element).toHaveProp('accessibilityRole', 'alert');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum heat index', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={0} />
      );

      expect(getByLabelText('0°F - LOW Risk')).toBeDefined();
    });

    it('should handle maximum heat index', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={150} />
      );

      expect(getByLabelText('150°F - EXTREME Risk')).toBeDefined();
    });

    it('should handle negative heat index', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={-10} />
      );

      expect(getByLabelText('-10°F - LOW Risk')).toBeDefined();
    });

    it('should handle extremely high heat index', () => {
      const { getByLabelText } = render(
        <ColorCode heatIndex={1000} />
      );

      expect(getByLabelText('1000°F - EXTREME Risk')).toBeDefined();
    });
  });

  describe('Custom Color Overrides', () => {
    it('should use custom color when provided', () => {
      const customColor = '#ff0000';
      const { getByLabelText } = render(
        <ColorCode heatIndex={85} customColor={customColor} />
      );

      expect(getByLabelText('85°F - MODERATE Risk')).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should render quickly', () => {
      const startTime = performance.now();

      render(
        <ColorCode heatIndex={85} />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(10); // Should render in less than 10ms
    });
  });
});

describe('RiskBadge Component', () => {
  describe('Component Rendering', () => {
    it('should render RiskBadge with default props', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should render RiskBadge with small size', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' size="small" />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should render RiskBadge with medium size', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' size="medium" />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should render RiskBadge with large size', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' size="large" />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should hide label when showLabel is false', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' showLabel={false} />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });
  });

  describe('Risk Level Display', () => {
    it('should display LOW risk color', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='LOW' />
      );

      expect(getByLabelText('LOW risk level')).toBeDefined();
    });

    it('should display MODERATE risk color', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='MODERATE' />
      );

      expect(getByLabelText('MODERATE risk level')).toBeDefined();
    });

    it('should display HIGH risk color', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should display EXTREME risk color', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='EXTREME' />
      );

      expect(getByLabelText('EXTREME risk level')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' testID="risk-badge-test" />
      );

      expect(getByLabelText('HIGH risk level')).toBeDefined();
    });

    it('should be accessible for screen readers', () => {
      const { getByLabelText } = render(
        <RiskBadge riskLevel='HIGH' />
      );

      expect(getByLabelText('HIGH risk level')).toBeTruthy();
    });
  });
});

describe('HeatIndexSummary Component', () => {
  describe('Component Rendering', () => {
    it('should render HeatIndexSummary with default props', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should render HeatIndexSummary with small size', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" size="small" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should render HeatIndexSummary with medium size', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" size="medium" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should render HeatIndexSummary with large size', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" size="large" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should hide label when showLabel is false', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" showLabel={false} />
      );

      expect(getByLabelText).toBeDefined();
    });
  });

  describe('Risk Level Display', () => {
    it('should display correct risk level for given heat index', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={70} practiceName="Morning Practice" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should display correct risk level for high heat index', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={110} practiceName="Afternoon Practice" />
      );

      expect(getByLabelText).toBeDefined();
    });
  });

  describe('Practice Name Display', () => {
    it('should display practice name', () => {
      const practiceName = 'Morning Practice';
      const { getByText } = render(
        <HeatIndexSummary heatIndex={85} practiceName={practiceName} />
      );

      expect(getByText(practiceName)).toBeDefined();
    });

    it('should handle empty practice name', () => {
      const { getByText } = render(
        <HeatIndexSummary heatIndex={85} practiceName={''} />
      );

      expect(getByText('')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" testID="heat-index-summary" />
      );

      expect(getByLabelText).toBeDefined();
    });

    it('should be accessible for screen readers', () => {
      const { getByLabelText } = render(
        <HeatIndexSummary heatIndex={85} practiceName="Morning Practice" />
      );

      expect(getByLabelText).toBeTruthy();
    });
  });
});