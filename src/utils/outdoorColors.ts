// Color scheme configuration for high-contrast outdoor visibility
// Designed to be visible in bright sunlight and various lighting conditions

// High-contrast primary colors for outdoor visibility
export const OUTDOOR_COLORS = {
  // Primary colors with high contrast against bright backgrounds
  PRIMARY: {
    // Blue for primary actions - high contrast in sunlight
    MAIN: '#1e40af',      // Deep blue - highly visible
    LIGHT: '#3b82f6',      // Medium blue - good contrast
    DARK: '#1e3a8a',      // Dark blue - for text
    HOVER: '#2563eb',      // Slightly lighter blue for interaction
  },
  
  // Success colors - must be highly visible
  SUCCESS: {
    MAIN: '#15803d',      // Deep green - highly visible
    LIGHT: '#22c55e',      // Medium green - good contrast
    DARK: '#14532d',       // Dark green - for text
    HOVER: '#16a34a',     // Slightly lighter green for interaction
  },
  
  // Warning colors - must stand out in bright conditions
  WARNING: {
    MAIN: '#ca8a04',      // Deep amber - highly visible
    LIGHT: '#eab308',      // Medium amber - good contrast
    DARK: '#a16207',       // Dark amber - for text
    HOVER: '#d97706',     // Slightly lighter amber for interaction
  },
  
  // Danger/High risk colors - must be immediately noticeable
  DANGER: {
    MAIN: '#b91c1c',      // Deep red - highly visible
    LIGHT: '#ef4444',      // Medium red - good contrast
    DARK: '#7f1d1d',       // Dark red - for text
    HOVER: '#dc2626',     // Slightly lighter red for interaction
  },
  
  // Neutral colors for text and backgrounds
  NEUTRAL: {
    WHITE: '#ffffff',      // Pure white for high contrast
    BLACK: '#000000',      // Pure black for text
    GRAY_50: '#f8fafc',    // Very light gray for backgrounds
    GRAY_100: '#f1f5f9',  // Light gray for subtle backgrounds
    GRAY_200: '#e2e8f0',  // Medium light gray for borders
    GRAY_300: '#cbd5e1',  // Medium gray for disabled states
    GRAY_400: '#94a3b8',  // Medium gray for text
    GRAY_500: '#64748b',  // Dark gray for secondary text
    GRAY_600: '#475569',  // Dark gray for labels
    GRAY_700: '#334155',  // Very dark gray for important text
    GRAY_800: '#1e293b',  // Near black for headers
    GRAY_900: '#0f172a',  // Black for critical text
  },
} as const;

// Heat index color scheme with high contrast for outdoor visibility
export const HEAT_INDEX_COLORS = {
  // Enhanced colors for better visibility in bright conditions
  LOW: {
    bg: '#15803d',        // Deep green - highly visible
    text: '#ffffff',      // White text for contrast
    border: '#166534',     // Darker green border
    shadow: '#14532d',     // Dark green shadow
    icon: '#ffffff',       // White icons
  },
  MODERATE: {
    bg: '#ca8a04',        // Deep amber - highly visible
    text: '#ffffff',      // White text for contrast
    border: '#a16207',    // Darker amber border
    shadow: '#92400e',    // Dark amber shadow
    icon: '#ffffff',      // White icons
  },
  HIGH: {
    bg: '#ea580c',        // Deep orange - highly visible
    text: '#ffffff',      // White text for contrast
    border: '#c2410c',    // Darker orange border
    shadow: '#9a3412',    // Dark orange shadow
    icon: '#ffffff',      // White icons
  },
  EXTREME: {
    bg: '#b91c1c',        // Deep red - highly visible
    text: '#ffffff',      // White text for contrast
    border: '#991b1b',    // Darker red border
    shadow: '#7f1d1d',    // Dark red shadow
    icon: '#ffffff',      // White icons
  },
} as const;

// Team color palette with high contrast
export const TEAM_COLORS = {
  // Vibrant, highly visible team colors
  RED: {
    main: '#dc2626',      // Bright red
    light: '#ef4444',     // Lighter red
    dark: '#b91c1c',      // Darker red
    text: '#ffffff',      // White text
  },
  BLUE: {
    main: '#2563eb',      // Bright blue
    light: '#3b82f6',     // Lighter blue
    dark: '#1d4ed8',      // Darker blue
    text: '#ffffff',      // White text
  },
  GREEN: {
    main: '#16a34a',      // Bright green
    light: '#22c55e',     // Lighter green
    dark: '#15803d',      // Darker green
    text: '#ffffff',      // White text
  },
  YELLOW: {
    main: '#ca8a04',      // Bright amber
    light: '#eab308',     // Lighter amber
    dark: '#a16207',      // Darker amber
    text: '#ffffff',      // White text
  },
  PURPLE: {
    main: '#9333ea',      // Bright purple
    light: '#a855f7',     // Lighter purple
    dark: '#7c3aed',      // Darker purple
    text: '#ffffff',      // White text
  },
  ORANGE: {
    main: '#ea580c',      // Bright orange
    light: '#f97316',     // Lighter orange
    dark: '#c2410c',      // Darker orange
    text: '#ffffff',      // White text
  },
  PINK: {
    main: '#db2777',      // Bright pink
    light: '#ec4899',     // Lighter pink
    dark: '#be185d',      // Darker pink
    text: '#ffffff',      // White text
  },
  TEAL: {
    main: '#0891b2',      // Bright teal
    light: '#06b6d4',     // Lighter teal
    dark: '#0e7490',      // Darker teal
    text: '#ffffff',      // White text
  },
} as const;

// High-contrast text color system
export const TEXT_COLORS = {
  // Text colors optimized for outdoor readability
  PRIMARY: '#0f172a',     // Near black - highest contrast
  SECONDARY: '#475569',   // Dark gray - good contrast
  TERTIARY: '#64748b',   // Medium gray - moderate contrast
  DISABLED: '#94a3b8',   // Light gray - for disabled states
  INVERSE: '#ffffff',    // White text for colored backgrounds
  LINK: '#1e40af',       // Blue for links - highly visible
  SUCCESS: '#15803d',     // Green for success - highly visible
  WARNING: '#ca8a04',    // Amber for warnings - highly visible
  ERROR: '#b91c1c',      // Red for errors - highly visible
} as const;

// Background color system for outdoor visibility
export const BACKGROUND_COLORS = {
  // Background colors with high contrast
  PRIMARY: '#ffffff',     // Pure white - maximum contrast
  SECONDARY: '#f8fafc',   // Very light gray - subtle contrast
  TERTIARY: '#f1f5f9',   // Light gray - moderate contrast
  DISABLED: '#f3f4f6',   // Medium light gray - for disabled backgrounds
  CARD: '#ffffff',       // White for cards - high contrast
  OVERLAY: '#1f2937',    // Dark overlay for modals
} as const;

// Border color system
export const BORDER_COLORS = {
  // Border colors optimized for visibility
  PRIMARY: '#e2e8f0',     // Light gray - subtle but visible
  SECONDARY: '#cbd5e1',   // Medium gray - more visible
  TERTIARY: '#94a3b8',    // Medium gray - high visibility
  DIVIDER: '#e2e8f0',     // Light gray for dividers
  FOCUS: '#3b82f6',      // Blue for focus states - highly visible
} as const;

// Shadow system for depth in bright conditions
export const SHADOWS = {
  // Subtle shadows for bright conditions
  SM: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  MD: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  LG: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Flat palette for component styles (single source of truth).
// Reuses the named constants above; keys are the flat names components import.
export const PALETTE = {
  WHITE: OUTDOOR_COLORS.NEUTRAL.WHITE,
  BLACK: OUTDOOR_COLORS.NEUTRAL.BLACK,
  TRANSPARENT: 'transparent',

  // Tailwind slate ramp (UI surfaces/text).
  GRAY_50: OUTDOOR_COLORS.NEUTRAL.GRAY_50,
  GRAY_100: OUTDOOR_COLORS.NEUTRAL.GRAY_100,
  GRAY_200: OUTDOOR_COLORS.NEUTRAL.GRAY_200,
  GRAY_300: OUTDOOR_COLORS.NEUTRAL.GRAY_300,
  GRAY_400: OUTDOOR_COLORS.NEUTRAL.GRAY_400,
  GRAY_500: OUTDOOR_COLORS.NEUTRAL.GRAY_500,
  GRAY_600: OUTDOOR_COLORS.NEUTRAL.GRAY_600,
  GRAY_700: OUTDOOR_COLORS.NEUTRAL.GRAY_700,
  GRAY_800: OUTDOOR_COLORS.NEUTRAL.GRAY_800,
  GRAY_900: OUTDOOR_COLORS.NEUTRAL.GRAY_900,

  // Alternate neutral ramp used across forms/lists.
  NEUTRAL_50: '#f9fafb',
  NEUTRAL_100: '#f3f4f6',
  NEUTRAL_200: '#e5e7eb',
  NEUTRAL_300: '#d1d5db',
  NEUTRAL_400: '#9ca3af',
  NEUTRAL_500: '#6b7280',
  NEUTRAL_600: '#4b5563',
  NEUTRAL_700: '#374151',
  NEUTRAL_800: '#1f2937',
  NEUTRAL_900: '#111827',

  // Semantic text.
  TEXT_DEFAULT: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  TEXT_DARK: '#111827',
  TEXT_STRONG: '#374151',
  TEXT_NEUTRAL: '#333333',

  // Brand / action.
  BLUE_500: OUTDOOR_COLORS.PRIMARY.LIGHT,
  BLUE_600: '#007bff',
  BLUE_700: OUTDOOR_COLORS.PRIMARY.HOVER,
  BLUE_800: OUTDOOR_COLORS.PRIMARY.MAIN,
  BLUE_900: OUTDOOR_COLORS.PRIMARY.DARK,
  BLUE_100: '#dbeafe',
  BLUE_200: '#bfdbfe',

  GREEN_500: OUTDOOR_COLORS.SUCCESS.LIGHT,
  GREEN_600: OUTDOOR_COLORS.SUCCESS.HOVER,
  EMERALD_500: '#10b981',

  RED_500: OUTDOOR_COLORS.DANGER.LIGHT,
  RED_600: OUTDOOR_COLORS.DANGER.HOVER,
  RED_700: OUTDOOR_COLORS.DANGER.MAIN,
  RED_800: '#991b1b',
  RED_900: OUTDOOR_COLORS.DANGER.DARK,
  RED_BOOTSTRAP: '#dc3545',
  RED_50: '#fef2f2',
  RED_100: '#fee2e2',

  AMBER_500: OUTDOOR_COLORS.WARNING.MAIN,
  AMBER_400: OUTDOOR_COLORS.WARNING.LIGHT,
  AMBER_600: OUTDOOR_COLORS.WARNING.HOVER,
  ORANGE_500: '#f97316',
  ORANGE_600: '#ea580c',
  ORANGE_700: '#c2410c',

  // Legacy / third-party grays.
  GRAY_MID: '#6c757d',
  GRAY_SOFT: '#f8f9fa',
  GRAY_NEUTRAL: '#333333',

  // Translucent black overlays.
  BLACK_10: 'rgba(0,0,0,0.1)',
  BLACK_30: 'rgba(0, 0, 0, 0.3)',

  // Overlays / modal scrims.
  OVERLAY: 'rgba(0, 0, 0, 0.5)',

  // Shadows.
  SHADOW_BLACK: '#000',
} as const;

export type PaletteKey = keyof typeof PALETTE;

// High-contrast color utility functions
export const OutdoorColors = {
  // Get heat index color with high contrast
  getHeatIndexColor: (heatIndex: number) => {
    if (heatIndex <= 80) return HEAT_INDEX_COLORS.LOW;
    if (heatIndex <= 90) return HEAT_INDEX_COLORS.MODERATE;
    if (heatIndex <= 105) return HEAT_INDEX_COLORS.HIGH;
    return HEAT_INDEX_COLORS.EXTREME;
  },

  // Get team color with high contrast
  getTeamColor: (colorName: keyof typeof TEAM_COLORS) => {
    return TEAM_COLORS[colorName];
  },

  // Get text color based on background
  getTextColor: (backgroundColor: string) => {
    // Simple contrast calculation - in real app, use proper contrast ratio
    if (backgroundColor === '#ffffff' || backgroundColor.startsWith('#f')) {
      return TEXT_COLORS.PRIMARY;
    }
    return TEXT_COLORS.INVERSE;
  },

  // Check if color is light (for text contrast decisions)
  isLightColor: (color: string): boolean => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  },

  // Generate high-contrast color variations
  generateColorVariations: (baseColor: string) => {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Create variations for high contrast
    return {
      main: baseColor,
      light: `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`,
      dark: `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`,
      text: OutdoorColors.isLightColor(baseColor) ? TEXT_COLORS.PRIMARY : TEXT_COLORS.INVERSE,
    };
  },

  // Get accessible color combinations
  getAccessibleCombination: (background: string) => {
    return {
      background,
      text: OutdoorColors.getTextColor(background),
      border: BORDER_COLORS.PRIMARY,
    };
  },
};

// Outdoor-optimized theme configuration
export const OUTDOOR_THEME = {
  colors: {
    ...OUTDOOR_COLORS,
    text: TEXT_COLORS,
    background: BACKGROUND_COLORS,
    border: BORDER_COLORS,
  },
  shadows: SHADOWS,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// CSS style generator for outdoor visibility
export const createOutdoorStyles = () => ({
  // High contrast text styles
  highContrastText: {
    color: TEXT_COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // High contrast button styles
  highContrastButton: {
    backgroundColor: OUTDOOR_COLORS.PRIMARY.MAIN,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.MD,
  },
  
  // High contrast card styles
  highContrastCard: {
    backgroundColor: BACKGROUND_COLORS.CARD,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.MD,
    borderWidth: 1,
    borderColor: BORDER_COLORS.PRIMARY,
  },
  
  // High contrast input styles
  highContrastInput: {
    backgroundColor: BACKGROUND_COLORS.SECONDARY,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BORDER_COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT_COLORS.PRIMARY,
    minHeight: 44,
  },
  
  // High contrast team indicator
  highContrastTeamIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BORDER_COLORS.PRIMARY,
  },
});

// Export types
export type OutdoorColorsType = typeof OUTDOOR_COLORS;
export type HeatIndexColorsType = typeof HEAT_INDEX_COLORS;
export type TeamColorsType = typeof TEAM_COLORS;
export type TextColorsType = typeof TEXT_COLORS;
export type BackgroundColorsType = typeof BACKGROUND_COLORS;
export type BorderColorsType = typeof BORDER_COLORS;
export type ShadowsType = typeof SHADOWS;