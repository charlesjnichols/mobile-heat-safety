import { z } from 'zod'

// Shared identifier pattern: starts with a letter, then letters, numbers, and hyphens
const ID_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/

// Team Schema
const TeamSchema = z.object({
  id: z.string().regex(ID_REGEX, 'ID must start with a letter and can contain letters, numbers, and hyphens'),
  name: z.string().min(1, 'Team name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Checklist Schema
const ChecklistSchema = z.object({
  id: z
    .string()
    .regex(
      ID_REGEX,
      'ID must start with a letter and can contain letters, numbers, and hyphens'
    ),
  practiceId: z
    .string()
    .regex(
      ID_REGEX,
      'Practice ID must start with a letter and can contain letters, numbers, and hyphens'
    ),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  temperature: z
    .number()
    .min(60, 'Temperature must be at least 60°F')
    .max(130, 'Temperature must be at most 130°F'),
  humidity: z
    .number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must be at most 100%'),
  heatIndex: z.number(),
  actionTaken: z.enum([
    'No restrictions',
    'Water breaks every 30 minutes',
    'Water breaks every 20 minutes',
    'Modified practice (reduced intensity)',
    'Modified practice (shortened duration)',
    'Cancel outdoor practice',
    'Move to indoor facility',
    'Other (specify)',
  ]),
  timestamp: z.string().optional(),
  deviceInfo: z.string().optional(),
})

// Practice Schema
const PracticeSchema = z.object({
  id: z
    .string()
    .regex(
      ID_REGEX,
      'ID must start with a letter and can contain letters, numbers, and hyphens'
    ),
  name: z
    .string()
    .min(1, 'Practice name is required')
    .max(100, 'Practice name must be less than 100 characters'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  coach: z
    .string()
    .min(1, 'Coach is required')
    .max(50, 'Coach name must be less than 50 characters'),
  headCoach: z.string().optional(),
  sport: z.string().min(1, 'Sport is required').max(50, 'Sport must be less than 50 characters'),
  contactInfo: z
    .string()
    .min(1, 'Contact info is required')
    .max(100, 'Contact info must be less than 100 characters'),
  date: z.string(),
  teamId: z.string().regex(ID_REGEX, 'Invalid team ID'),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').default(''),
  checklists: z.array(ChecklistSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// HeatIndex Schema
const HeatIndexSchema = z.object({
  value: z.number(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'EXTREME']),
  color: z.string(),
  timestamp: z.string(),
})

// Root Data Schema
const HeatSafetyDataSchema = z.object({
  version: z.string(),
  lastSync: z.string().nullable(),
  data: z.object({
    teams: z.array(TeamSchema),
    practices: z.array(PracticeSchema),
  }),
})

// Export all schemas
export { TeamSchema, PracticeSchema, ChecklistSchema, HeatIndexSchema, HeatSafetyDataSchema }

// Form validation schemas
export const TeamFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(50, 'Team name must be less than 50 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
})

export const PracticeFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Practice name is required')
    .max(100, 'Practice name must be less than 100 characters'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  coach: z
    .string()
    .min(1, 'Coach is required')
    .max(50, 'Coach name must be less than 50 characters'),
  sport: z.string().min(1, 'Sport is required').max(50, 'Sport must be less than 50 characters'),
  contactInfo: z
    .string()
    .min(1, 'Contact info is required')
    .max(100, 'Contact info must be less than 100 characters'),
})

export const ChecklistFormSchema = z.object({
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  temperature: z
    .number()
    .min(60, 'Temperature must be at least 60°F')
    .max(130, 'Temperature must be at most 130°F'),
  humidity: z
    .number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must be at most 100%'),
  actionTaken: z
    .enum([
      'No restrictions',
      'Water breaks every 30 minutes',
      'Water breaks every 20 minutes',
      'Modified practice (reduced intensity)',
      'Modified practice (shortened duration)',
      'Cancel outdoor practice',
      'Move to indoor facility',
      'Other (specify)',
    ])
    .optional(),
})

// Type exports
export type Team = z.infer<typeof TeamSchema>
export type Checklist = z.infer<typeof ChecklistSchema>
export type Practice = z.infer<typeof PracticeSchema>
export type HeatIndex = z.infer<typeof HeatIndexSchema>
export type HeatSafetyData = z.infer<typeof HeatSafetyDataSchema>
export type TeamFormData = z.infer<typeof TeamFormSchema>
export type PracticeFormData = z.infer<typeof PracticeFormSchema>
export type ChecklistFormData = z.infer<typeof ChecklistFormSchema>

// Validation utility functions
export const validateTeam = (data: unknown): Team => {
  return TeamSchema.parse(data)
}

export const validatePractice = (data: unknown): Practice => {
  return PracticeSchema.parse(data)
}

export const validateChecklist = (data: unknown): Checklist => {
  return ChecklistSchema.parse(data)
}

export const validateHeatSafetyData = (data: unknown): HeatSafetyData => {
  return HeatSafetyDataSchema.parse(data)
}

// Error handling for validation — aggregate same-path messages with a separator
export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {}

  error.errors.forEach(issue => {
    const path = issue.path.join('.')
    errors[path] = errors[path] ? `${errors[path]}; ${issue.message}` : issue.message
  })

  return errors
}

// Safe parse function that returns error messages
export const safeParse = <T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: getValidationErrors(result.error) }
}
