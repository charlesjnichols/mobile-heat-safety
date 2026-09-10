// Type definitions for the Mobile Heat Safety Tracker
// These types are exported from validation schemas and used throughout the app

import { z } from 'zod';
import { 
  TeamSchema, 
  PracticeSchema, 
  ChecklistSchema, 
  HeatIndexSchema, 
  HeatSafetyDataSchema,
  TeamFormSchema,
  PracticeFormSchema,
  ChecklistFormSchema
} from '../utils/validation';

// Re-export validation types from validation schema
export type Team = z.infer<typeof TeamSchema>;
export type Practice = z.infer<typeof PracticeSchema>;
export type Checklist = z.infer<typeof ChecklistSchema>;
export type HeatIndex = z.infer<typeof HeatIndexSchema>;
export type HeatSafetyData = z.infer<typeof HeatSafetyDataSchema>;
export type TeamFormData = z.infer<typeof TeamFormSchema>;
export type PracticeFormData = z.infer<typeof PracticeFormSchema>;
export type ChecklistFormData = z.infer<typeof ChecklistFormSchema>;

// Re-export validation schemas for direct use
export { TeamSchema, PracticeSchema, ChecklistSchema, HeatIndexSchema, HeatSafetyDataSchema, TeamFormSchema, PracticeFormSchema, ChecklistFormSchema };

// Heat index related types
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface HeatIndexResult {
  value: number;
  riskLevel: RiskLevel;
  color: string;
  timestamp: Date;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  PracticeDetail: { practiceId: string };
  PracticeForm: { practiceId?: string; teamId?: string };
  ChecklistForm: { practiceId: string; checklistId?: string; isEdit?: boolean };
  TeamDetail: { teamId: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Main: undefined;
  Teams: undefined;
  Safety: undefined;
  Settings: undefined;
};

// Form state types
export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface PracticeFormState extends FormState {
  date: string;
  location: string;
  headCoach: string;
  teamId: string;
}

export interface ChecklistFormState extends FormState {
  time: string;
  temperature: string;
  humidity: string;
  actionTaken: string;
}

export interface TeamFormState extends FormState {
  name: string;
  color: string;
}

// Filter types
export interface PracticeFilters {
  teamId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

// Error handling types
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'success';

export interface ErrorMessage {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// API response types (for future network integration)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Statistics types
export interface PracticeStats {
  total: number;
  highRisk: number;
  averageHeatIndex: number;
  totalChecklists: number;
}

export interface TeamStats {
  team: Team;
  practiceCount: number;
  totalChecklists: number;
  maxHeatIndex: number;
  averageHeatIndex: number;
}

// Device types
export interface DeviceInfo {
  model: string;
  os: string;
  version: string;
  isVirtualDevice: boolean;
}

// Export/Import types
export interface ExportData {
  exportedAt: string;
  version: string;
  data: {
    teams: Team[];
    practices: Practice[];
  };
}

// Performance monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentSize: number;
  loadTime: number;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  hapticFeedback: boolean;
  autoSync: boolean;
  notifications: {
    highRiskAlerts: boolean;
    practiceReminders: boolean;
  };
}

// Constants
export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    HEAT_SAFETY_DATA: 'heatSafetyData',
    USER_PREFERENCES: 'userPreferences',
    APP_SETTINGS: 'appSettings',
  },
  DATE_FORMATS: {
    DISPLAY: 'MMM DD, YYYY',
    INPUT: 'YYYY-MM-DD',
    TIME: 'HH:mm',
  },
  HEAT_THRESHOLDS: {
    LOW: { max: 80, color: '#22c55e' },
    MODERATE: { max: 90, color: '#eab308' },
    HIGH: { max: 105, color: '#f97316' },
    EXTREME: { max: Infinity, color: '#dc2626' },
  },
  VALIDATION_BOUNDS: {
    TEMPERATURE: { min: 60, max: 130 },
    HUMIDITY: { min: 0, max: 100 },
  },
  ACTION_TAKEN_OPTIONS: [
    'No restrictions',
    'Water breaks every 30 minutes',
    'Water breaks every 20 minutes',
    'Modified practice (reduced intensity)',
    'Modified practice (shortened duration)',
    'Cancel outdoor practice',
    'Move to indoor facility',
    'Other (specify)',
  ] as const,
  // Mobile styling constants
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    BACKGROUND: '#F2F2F7',
    CARD_BACKGROUND: '#FFFFFF',
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#8E8E93',
    BORDER: '#C6C6C8',
    SHADOW: '#00000020',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  FONT_SIZES: {
    CAPTION: 12,
    BODY: 14,
    SUBTITLE: 16,
    TITLE: 18,
    HEADLINE: 24,
  },
} as const;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Brand types for better type safety
export type Brand<T, B extends string> = T & { __brand: B };

export type PracticeId = Brand<string, 'PracticeId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type ChecklistId = Brand<string, 'ChecklistId'>;

// Event types
export type PracticeEvent = {
  type: 'PRACTICE_CREATED' | 'PRACTICE_UPDATED' | 'PRACTICE_DELETED';
  practiceId: PracticeId;
  timestamp: Date;
  userId?: string;
};

export type ChecklistEvent = {
  type: 'CHECKLIST_ADDED' | 'CHECKLIST_UPDATED' | 'CHECKLIST_DELETED';
  practiceId: PracticeId;
  checklistId: ChecklistId;
  timestamp: Date;
  userId?: string;
};

export type TeamEvent = {
  type: 'TEAM_CREATED' | 'TEAM_UPDATED' | 'TEAM_DELETED';
  teamId: TeamId;
  timestamp: Date;
  userId?: string;
};

// Union types
export type AppEvent = PracticeEvent | ChecklistEvent | TeamEvent;

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// Hook return types
export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  handleChange: (field: keyof T, value: unknown) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (callback: (values: T) => Promise<void> | void) => Promise<void>;
  setValues: (values: T) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetForm: () => void;
}