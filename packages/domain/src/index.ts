import type { Team } from './schemas'
export * from './schemas'

// Heat index related types
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME'

export interface HeatIndexResult {
  value: number
  riskLevel: RiskLevel
  color: string
  timestamp: Date
}

// API response types shared by client and server
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

// Statistics types
export interface PracticeStats {
  total: number
  highRisk: number
  averageHeatIndex: number
  totalChecklists: number
}

export interface TeamStats {
  team: Team
  practiceCount: number
  totalChecklists: number
  maxHeatIndex: number
  averageHeatIndex: number
}

// Brand types for better type safety
export type Brand<T, B extends string> = T & { __brand: B }

export type PracticeId = Brand<string, 'PracticeId'>
export type TeamId = Brand<string, 'TeamId'>
export type ChecklistId = Brand<string, 'ChecklistId'>
