// Static reference content for the Heat Stress Quick Reference Guide.
//
// This module consolidates the three source documents in guides/:
//   1. Heat Stress Color Code Poster       -> conditionBands
//   2. Heat Stress Prevention Quick Ref    -> preventionTopics + call911Triggers
//   3. Heat Stress Symptoms Quick Ref      -> conditions
//
// All content is immutable at runtime and authored as `as const` so the view
// and this module share a single, strictly-typed contract with no `any`.

export type BandSeverity = 'moderate' | 'high' | 'critical'

export interface ConditionBand {
  id: 'elevated' | 'high' | 'extreme'
  title: string
  severity: BandSeverity
  codeLabel: string | null
  summary: string
  coachResponsibilities: readonly string[]
  athleteResponsibilities: readonly string[]
}

export type PreventionTopicId =
  | 'acclimatization'
  | 'water-shade'
  | 'high-heat-procedures'
  | 'training'

export interface PreventionTopic {
  id: PreventionTopicId
  title: string
  points: readonly string[]
}

export type ConditionId =
  | 'heat-rash'
  | 'heat-cramps'
  | 'heat-exhaustion'
  | 'heat-stroke'

export interface GuideCondition {
  id: ConditionId
  name: string
  isEmergency: boolean
  symptoms: readonly string[]
  response: readonly string[]
  escalationNote: string | null
}

// Shared disclaimer (FR-006): temperatures are heat index values.
export const heatIndexDisclaimer =
  'All temperatures are heat index values (temperature + humidity), not air temperature alone.'

// Section headings kept here so the view and any tests share the same strings.
export const guideSections = {
  conditions: 'Operating Conditions',
  prevention: 'Prevention',
  symptoms: 'Symptoms & First Aid',
} as const

export const conditionBands = [
  {
    id: 'elevated',
    title: 'Elevated Heat Conditions',
    severity: 'moderate',
    codeLabel: null,
    summary:
      'Warm conditions are present. Early heat stress is possible, especially for new or returning athletes.',
    coachResponsibilities: [
      'Monitor athletes, especially during the first 14 days of acclimatization',
      'Ensure water is readily available',
      'Plan for rising heat conditions',
    ],
    athleteResponsibilities: [
      'Drink water frequently',
      'Take breaks in shaded or cool areas',
      'Report early symptoms of heat illness',
    ],
  },
  {
    id: 'high',
    title: 'High Heat Conditions',
    severity: 'high',
    codeLabel: null,
    summary: 'Heat-related illness is more likely without proper precautions.',
    coachResponsibilities: [
      'Enforce minimum 10-minute breaks every 2 hours',
      'Actively monitor athletes for symptoms',
      'Implement buddy system / check-ins',
      'Adjust workloads as needed',
    ],
    athleteResponsibilities: [
      'Hydrate consistently (do not wait until thirsty)',
      'Take scheduled breaks',
      'Report symptoms immediately',
    ],
  },
  {
    id: 'extreme',
    title: 'Extreme Heat Conditions',
    severity: 'critical',
    codeLabel: 'Code Red',
    summary: 'Heat-related illness is highly likely without strict controls.',
    coachResponsibilities: [
      'Enforce minimum 15-minute breaks every hour',
      'Ensure hydration during all breaks',
    ],
    athleteResponsibilities: [
      'Hydrate continuously throughout the day',
      'Use break periods to cool down and rehydrate',
      'Follow all Code Red precautions',
    ],
  },
] as const satisfies readonly ConditionBand[]

export const preventionTopics = [
  {
    id: 'acclimatization',
    title: 'Acclimatization',
    points: [
      'Monitor new/returning athletes for the first 14 days',
      'Use extra caution during heat waves (80°F+ and rising)',
      'Gradually increase workload and exposure',
    ],
  },
  {
    id: 'water-shade',
    title: 'Water & Shade',
    points: [
      'Drink 32 oz of water per hour',
      'Water must be close to the work area',
    ],
  },
  {
    id: 'high-heat-procedures',
    title: 'High Heat Procedures',
    points: [
      'Heat index 100°F+ — 15-minute break every hour',
      'Use buddy system / check-ins',
      'Monitor for symptoms continuously',
    ],
  },
  {
    id: 'training',
    title: 'Training',
    points: [
      'Initial + annual refresher training required',
      'Heat illness recognition',
      'Hydration & rest importance',
    ],
  },
] as const satisfies readonly PreventionTopic[]

export const call911Triggers = [
  'Worker is confused, unresponsive, or seizing',
  'Symptoms of heat illness do not improve with cooling',
  'Suspected heat stroke',
] as const satisfies readonly string[]

export const conditions = [
  {
    id: 'heat-rash',
    name: 'Heat Rash',
    isEmergency: false,
    symptoms: [
      'Skin eruptions',
      'Itchy red skin',
      'Reduced sweating',
    ],
    response: [
      'Keep skin cool and dry',
      'Change wet clothing',
      'Reduce heat exposure',
    ],
    escalationNote: null,
  },
  {
    id: 'heat-cramps',
    name: 'Heat Cramps',
    isEmergency: false,
    symptoms: [
      'Painful muscle cramps',
      'Incapacitating muscle pain',
    ],
    response: [
      'Drink fluids with electrolytes',
      'Stop activity until cramps go away',
    ],
    escalationNote: null,
  },
  {
    id: 'heat-exhaustion',
    name: 'Heat Exhaustion',
    isEmergency: false,
    symptoms: [
      'Heavy sweating',
      'Cool, pale, sweaty skin',
      'Nausea/vomiting',
      'Headache',
      'Dizziness',
      'Weakness',
    ],
    response: [
      'Stop activity',
      'Move to a cool place',
      'Remove excess clothing',
      'Spray or apply a wet cloth for cooling',
      'Fan the person to help cooling',
      'Provide fluids if alert & able to swallow',
    ],
    escalationNote: 'Call 911 if no improvement after cooling treatments.',
  },
  {
    id: 'heat-stroke',
    name: 'Heat Stroke',
    isEmergency: true,
    symptoms: [
      'Skin hot to touch',
      'Confused, unresponsive',
      'Seizure possible',
    ],
    response: [
      'Call 911, begin cooling immediately',
      'Apply cold water with cloths/fan',
      'Use cold packs (neck, armpits, groin)',
      'Continue cooling until EMS arrives',
    ],
    escalationNote: null,
  },
] as const satisfies readonly GuideCondition[]

export default {
  heatIndexDisclaimer,
  guideSections,
  conditionBands,
  preventionTopics,
  call911Triggers,
  conditions,
}