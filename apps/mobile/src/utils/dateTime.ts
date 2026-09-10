// Pure, deterministic date/time helpers for the mobile-first pickers.
// All functions are pure (no side effects) and produce the exact string
// formats (`YYYY-MM-DD`, `HH:MM`) used by the existing data model.

export interface DateParts {
  year: number
  month: number // 1-12
  day: number // 1-31
}

export interface TimeParts {
  hour: number // 0-23
  minute: number // 0-59
}

const pad2 = (n: number): string => n.toString().padStart(2, '0')

/** Number of days in a given month (1-indexed), accounting for leap years. */
export const daysInMonth = (year: number, month: number): number => {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    return isLeap ? 29 : 28
  }
  const thirtyOne = [1, 3, 5, 7, 8, 10, 12]
  return thirtyOne.includes(month) ? 31 : 30
}

/** Validate a parsed date against the real calendar (catches Feb 30, etc.). */
export const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12) return false
  if (day < 1 || day > daysInMonth(year, month)) return false
  return true
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** True if the string is a valid `YYYY-MM-DD` real-calendar date. */
export const isValidDateString = (value: string): boolean => {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  return isValidDate(y, m, d)
}

/** Parse a `YYYY-MM-DD` string into parts or null if invalid. */
export const parseDate = (value: string): DateParts | null => {
  if (!isValidDateString(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

/** Format parts into `YYYY-MM-DD`. */
export const formatDate = ({ year, month, day }: DateParts): string =>
  `${year}-${pad2(month)}-${pad2(day)}`

/** Today's date in `YYYY-MM-DD` using local time. */
export const todayString = (): string => {
  const now = new Date()
  return formatDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  })
}

/** Current local time in `HH:MM`. */
export const nowTimeString = (): string => {
  const now = new Date()
  return formatTime({ hour: now.getHours(), minute: now.getMinutes() })
}

const TIME_RE = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

/** True if the string is a valid `HH:MM` (24-hour) time. */
export const isValidTimeString = (value: string): boolean => TIME_RE.test(value)

/** Parse a `HH:MM` string into parts or null if invalid. */
export const parseTime = (value: string): TimeParts | null => {
  if (!isValidTimeString(value)) return null
  const [hour, minute] = value.split(':').map(Number)
  return { hour, minute }
}

/** Format parts into zero-padded `HH:MM`. */
export const formatTime = ({ hour, minute }: TimeParts): string =>
  `${pad2(hour)}:${pad2(minute)}`

export type AmPm = 'AM' | 'PM'

/** Convert a 24-hour hour (0-23) into a 12-hour clock value (1-12) and its period. */
export const to12Hour = (hour: number): { hour: number; period: AmPm } =>
  hour === 0
    ? { hour: 12, period: 'AM' }
    : hour < 12
      ? { hour, period: 'AM' }
      : hour === 12
        ? { hour: 12, period: 'PM' }
        : { hour: hour - 12, period: 'PM' }

/** Convert a 12-hour clock value + period back into a 24-hour hour (0-23). */
export const from12Hour = (hour12: number, period: AmPm): number => {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12
  }
  return hour12 === 12 ? 12 : hour12 + 12
}

/** Render a `HH:MM` (24-hour) time string in 12-hour AM/PM display form, e.g. "2:30 PM". */
export const formatTime12 = (value: string): string => {
  const parts = parseTime(value)
  if (!parts) return value
  const { hour, period } = to12Hour(parts.hour)
  return `${hour}:${pad2(parts.minute)} ${period}`
}

/**
 * Build the list of `{ year, month }` cells for a full month grid.
 * Returns leading empty cells (when the month starts mid-week, Sunday-start).
 */
export interface DayCell {
  key: string
  date: DateParts | null
  dayOfMonth: number | null
  inMonth: boolean
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const buildMonthGrid = (
  year: number,
  month: number
): { cells: DayCell[]; weekdayOffset: number } => {
  // First day of month weekday (0 = Sunday)
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const days = daysInMonth(year, month)
  const cells: DayCell[] = []

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `lead-${i}`, date: null, dayOfMonth: null, inMonth: false })
  }
  for (let d = 1; d <= days; d++) {
    cells.push({
      key: `d-${year}-${month}-${d}`,
      date: { year, month, day: d },
      dayOfMonth: d,
      inMonth: true,
    })
  }
  return { cells, weekdayOffset: firstWeekday }
}

/** Shift a year/month forward (or backward) by a delta of months. */
export const shiftMonth = (
  year: number,
  month: number,
  delta: number
): { year: number; month: number } => {
  const total = year * 12 + (month - 1) + delta
  const newYear = Math.floor(total / 12)
  // Handle negative months correctly: ((total % 12) + 12) % 12 yields 0-11.
  const newMonth = ((total % 12) + 12) % 12 + 1
  return { year: newYear, month: newMonth }
}

/** Get the month name (e.g., "February"). */
export const monthName = (month: number): string =>
  new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })

/** Get a human-readable label for a date for accessibility (e.g., "Mon, Feb 5, 2026"). */
export const dateLabel = ({ year, month, day }: DateParts): string =>
  new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })