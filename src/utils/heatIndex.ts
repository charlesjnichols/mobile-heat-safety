/**
 * National Weather Service Heat Index Calculator
 * 
 * Implements the exact NWS polynomial formula for heat index calculations
 * with precision validation for mobile performance.
 * 
 * Formula: 
 * HI = -42.379 + 2.04901523T + 10.14333127RH - 0.22475541TRH 
 *      - 0.00683783T² - 0.05481717RHD² + 0.00122874T²RH 
 *      + 0.00085282TRH² - 0.00000199T²RH²
 * 
 * Where T = Temperature (°F), RH = Relative Humidity (%)
 */

// Heat index risk levels
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

// Heat index result with calculated properties
export interface HeatIndexResult {
  value: number;
  riskLevel: RiskLevel;
  color: string;
  timestamp: Date;
}

// Risk level thresholds and colors
export const HEAT_THRESHOLDS = {
  LOW: { max: 79, color: '#22c55e' }, // Green (heat index below 80)
  MODERATE: { max: 90, color: '#eab308' }, // Yellow
  HIGH: { max: 105, color: '#f97316' }, // Orange
  EXTREME: { max: Infinity, color: '#dc2626' }, // Red
} as const;

/**
 * Determine the heat risk level for a given heat index value.
 * Shared by HeatIndexIndicator, practiceFilter, and ColorCode to avoid
 * duplicating the 80/90/105 threshold logic.
 */
export const getHeatRisk = (value: number): RiskLevel => {
  if (value <= HEAT_THRESHOLDS.LOW.max) return 'LOW';
  if (value <= HEAT_THRESHOLDS.MODERATE.max) return 'MODERATE';
  if (value <= HEAT_THRESHOLDS.HIGH.max) return 'HIGH';
  return 'EXTREME';
};

// Temperature and humidity validation bounds
const VALIDATION_BOUNDS = {
  TEMPERATURE: { min: 60, max: 130 },
  HUMIDITY: { min: 0, max: 100 },
};

/**
 * Calculate heat index using exact NWS polynomial formula
 * @param temperature - Temperature in Fahrenheit (60-130°F)
 * @param humidity - Relative humidity percentage (0-100%)
 * @returns Heat index value
 * @throws Error if inputs are out of valid range
 */
export const calculateHeatIndex = (temperature: number, humidity: number): number => {
  // Input validation — reject non-finite values so NaN/Infinity never propagate
  if (
    !Number.isFinite(temperature) ||
    !Number.isFinite(humidity) ||
    temperature < VALIDATION_BOUNDS.TEMPERATURE.min ||
    temperature > VALIDATION_BOUNDS.TEMPERATURE.max ||
    humidity < VALIDATION_BOUNDS.HUMIDITY.min ||
    humidity > VALIDATION_BOUNDS.HUMIDITY.max
  ) {
    throw new Error(
      `Invalid input: temperature must be ${VALIDATION_BOUNDS.TEMPERATURE.min}-${VALIDATION_BOUNDS.TEMPERATURE.max}°F, ` +
      `humidity must be ${VALIDATION_BOUNDS.HUMIDITY.min}-${VALIDATION_BOUNDS.HUMIDITY.max}%`
    );
  }

  // NWS polynomial formula implementation
  const T = temperature;
  const RH = humidity;

  let heatIndex =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Apply the two NWS corrective adjustments that improve accuracy at the
  // temperature/humidity extremes.
  if (RH < 13 && T >= 80 && T <= 112) {
    heatIndex -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (RH > 85 && T >= 80 && T <= 87) {
    heatIndex += ((RH - 85) / 10) * ((87 - T) / 5);
  }

  // The Rothfusz regression is only calibrated for warm/humid conditions and
  // can return values below the ambient temperature outside that range.
  // The heat index can never be lower than the actual air temperature,
  // so clamp the result to the temperature.
  const clamped = Math.max(heatIndex, T);

  // Round to 1 decimal place for display
  return Math.round(clamped * 10) / 10;
};

/**
 * Determine risk level based on heat index value
 * @param heatIndex - Heat index value
 * @returns Risk level
 */
export const getRiskLevel = (heatIndex: number): RiskLevel => {
  return getHeatRisk(heatIndex);
};

/**
 * Get color code for heat index display
 * @param heatIndex - Heat index value
 * @returns Color string in hex format
 */
export const getHeatIndexColor = (heatIndex: number): string => {
  const riskLevel = getRiskLevel(heatIndex);
  return HEAT_THRESHOLDS[riskLevel].color;
};

/**
 * Get heat index result with all calculated properties
 * @param temperature - Temperature in Fahrenheit
 * @param humidity - Relative humidity percentage
 * @returns Complete heat index result
 */
export const getHeatIndexResult = (temperature: number, humidity: number): HeatIndexResult => {
  const heatIndex = calculateHeatIndex(temperature, humidity);
  const riskLevel = getRiskLevel(heatIndex);
  const color = getHeatIndexColor(heatIndex);
  
  return {
    value: heatIndex,
    riskLevel,
    color,
    timestamp: new Date(),
  };
};

/**
 * Validate temperature input
 * @param temperature - Temperature in Fahrenheit
 * @returns Boolean indicating if temperature is valid
 */
export const isValidTemperature = (temperature: number): boolean => {
  return (
    temperature >= VALIDATION_BOUNDS.TEMPERATURE.min &&
    temperature <= VALIDATION_BOUNDS.TEMPERATURE.max
  );
};

/**
 * Validate humidity input
 * @param humidity - Relative humidity percentage
 * @returns Boolean indicating if humidity is valid
 */
export const isValidHumidity = (humidity: number): boolean => {
  return (
    humidity >= VALIDATION_BOUNDS.HUMIDITY.min &&
    humidity <= VALIDATION_BOUNDS.HUMIDITY.max
  );
};

/**
 * Get validation error message for temperature
 * @param temperature - Temperature in Fahrenheit
 * @returns Error message or null if valid
 */
export const getTemperatureError = (temperature: number): string | null => {
  if (!isValidTemperature(temperature)) {
    return `Temperature must be between ${VALIDATION_BOUNDS.TEMPERATURE.min}°F and ${VALIDATION_BOUNDS.TEMPERATURE.max}°F`;
  }
  return null;
};

/**
 * Get validation error message for humidity
 * @param humidity - Relative humidity percentage
 * @returns Error message or null if valid
 */
export const getHumidityError = (humidity: number): string | null => {
  if (!isValidHumidity(humidity)) {
    return `Humidity must be between ${VALIDATION_BOUNDS.HUMIDITY.min}% and ${VALIDATION_BOUNDS.HUMIDITY.max}%`;
  }
  return null;
};

/**
 * Get safety recommendations based on heat index
 * @param heatIndex - Heat index value
 * @returns Array of safety recommendations
 */
export const getSafetyRecommendations = (heatIndex: number): string[] => {
  const riskLevel = getRiskLevel(heatIndex);
  
  switch (riskLevel) {
    case 'LOW':
      return ['Normal practice conditions', 'Standard hydration recommended'];
    
    case 'MODERATE':
      return ['Increased hydration recommended', 'Monitor athletes closely'];
    
    case 'HIGH':
      return ['Frequent water breaks every 20 minutes', 'Reduce practice intensity', 'Consider modifying practice'];
    
    case 'EXTREME':
      return ['Cancel outdoor practice', 'Move to indoor facility', 'Implement extreme heat protocols'];
    
    default:
      return ['Monitor conditions and athlete wellbeing'];
  }
};

/**
 * Calculate heat index with memoization for performance optimization
 * @param temperature - Temperature in Fahrenheit
 * @param humidity - Relative humidity percentage
 * @returns Heat index value
 */
export const memoizedHeatIndexCalculation = (() => {
  const cache = new Map<string, number>();
  
  return (temperature: number, humidity: number): number => {
    const key = `${temperature}-${humidity}`;
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = calculateHeatIndex(temperature, humidity);
    cache.set(key, result);
    
    // Limit cache size to prevent memory issues
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  };
})();