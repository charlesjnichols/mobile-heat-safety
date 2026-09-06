import {
  daysInMonth,
  isValidDate,
  isValidDateString,
  isValidTimeString,
  parseDate,
  parseTime,
  formatDate,
  formatTime,
  to12Hour,
  from12Hour,
  formatTime12,
  buildMonthGrid,
  shiftMonth,
  todayString,
  nowTimeString,
} from './dateTime'

describe('dateTime pure helpers', () => {
  describe('daysInMonth', () => {
    it('returns 31 for January', () => {
      expect(daysInMonth(2026, 1)).toBe(31)
    })
    it('returns 28 for February in a non-leap year', () => {
      expect(daysInMonth(2025, 2)).toBe(28)
    })
    it('returns 29 for February in a leap year', () => {
      expect(daysInMonth(2024, 2)).toBe(29)
    })
    it('returns 29 for February in a century leap year divisible by 400', () => {
      expect(daysInMonth(2000, 2)).toBe(29)
    })
    it('returns 28 for February in a century year not divisible by 400', () => {
      expect(daysInMonth(1900, 2)).toBe(28)
    })
    it('returns 30 for April', () => {
      expect(daysInMonth(2026, 4)).toBe(30)
    })
  })

  describe('isValidDate / isValidDateString', () => {
    it('rejects Feb 30', () => {
      expect(isValidDate(2026, 2, 30)).toBe(false)
    })
    it('accepts Feb 29 in a leap year', () => {
      expect(isValidDate(2024, 2, 29)).toBe(true)
    })
    it('rejects month 0 and 13', () => {
      expect(isValidDate(2026, 0, 1)).toBe(false)
      expect(isValidDate(2026, 13, 1)).toBe(false)
    })
    it('rejects day 0 and 32', () => {
      expect(isValidDate(2026, 1, 0)).toBe(false)
      expect(isValidDate(2026, 1, 32)).toBe(false)
    })
    it('validates a well-formed string and rejects malformed ones', () => {
      expect(isValidDateString('2026-02-05')).toBe(true)
      expect(isValidDateString('2026-02-30')).toBe(false)
      expect(isValidDateString('2026/02/05')).toBe(false)
      expect(isValidDateString('not-a-date')).toBe(false)
    })
  })

  describe('parseDate / formatDate round-trip', () => {
    it('parses a valid date', () => {
      expect(parseDate('2026-02-05')).toEqual({ year: 2026, month: 2, day: 5 })
    })
    it('returns null for invalid date', () => {
      expect(parseDate('2026-02-30')).toBeNull()
      expect(parseDate('garbage')).toBeNull()
    })
    it('formats parts with zero-padding', () => {
      expect(formatDate({ year: 2026, month: 2, day: 5 })).toBe('2026-02-05')
      expect(formatDate({ year: 2026, month: 12, day: 31 })).toBe('2026-12-31')
    })
  })

  describe('parseTime / formatTime round-trip', () => {
    it('parses valid time', () => {
      expect(parseTime('14:30')).toEqual({ hour: 14, minute: 30 })
      expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 })
      expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 })
    })
    it('rejects invalid times', () => {
      expect(parseTime('24:00')).toBeNull()
      expect(parseTime('12:60')).toBeNull()
      expect(parseTime('nope')).toBeNull()
    })
    it('formats with zero-padding', () => {
      expect(formatTime({ hour: 9, minute: 5 })).toBe('09:05')
      expect(formatTime({ hour: 23, minute: 59 })).toBe('23:59')
    })
    it('validates time strings', () => {
      expect(isValidTimeString('14:30')).toBe(true)
      expect(isValidTimeString('24:00')).toBe(false)
      expect(isValidTimeString('12:60')).toBe(false)
    })
  })

  describe('AM/PM conversion', () => {
    it('converts 24-hour to 12-hour', () => {
      expect(to12Hour(0)).toEqual({ hour: 12, period: 'AM' })
      expect(to12Hour(9)).toEqual({ hour: 9, period: 'AM' })
      expect(to12Hour(12)).toEqual({ hour: 12, period: 'PM' })
      expect(to12Hour(14)).toEqual({ hour: 2, period: 'PM' })
      expect(to12Hour(23)).toEqual({ hour: 11, period: 'PM' })
    })

    it('converts 12-hour back to 24-hour', () => {
      expect(from12Hour(12, 'AM')).toBe(0)
      expect(from12Hour(9, 'AM')).toBe(9)
      expect(from12Hour(12, 'PM')).toBe(12)
      expect(from12Hour(2, 'PM')).toBe(14)
      expect(from12Hour(11, 'PM')).toBe(23)
    })

    it('round-trips any 24-hour hour through 12-hour conversion', () => {
      for (let h = 0; h < 24; h++) {
        const { hour, period } = to12Hour(h)
        expect(from12Hour(hour, period)).toBe(h)
      }
    })

    it('formats 24-hour time strings in AM/PM display form', () => {
      expect(formatTime12('09:05')).toBe('9:05 AM')
      expect(formatTime12('14:30')).toBe('2:30 PM')
      expect(formatTime12('00:00')).toBe('12:00 AM')
      expect(formatTime12('12:00')).toBe('12:00 PM')
    })

    it('returns invalid input unchanged', () => {
      expect(formatTime12('garbage')).toBe('garbage')
    })
  })

  describe('buildMonthGrid', () => {
    it('builds a grid with correct leading offset for a month starting on Wednesday', () => {
      // Jan 2026 starts on a Thursday (weekday 4, Sunday-start)
      const { cells, weekdayOffset } = buildMonthGrid(2026, 1)
      expect(weekdayOffset).toBe(new Date(2026, 0, 1).getDay())
      expect(cells[weekdayOffset].dayOfMonth).toBe(1)
      // 31 days in January
      const inMonth = cells.filter(c => c.inMonth)
      expect(inMonth.length).toBe(31)
    })
    it('never includes Feb 30', () => {
      const { cells } = buildMonthGrid(2025, 2)
      const inMonth = cells.filter(c => c.inMonth)
      expect(inMonth.length).toBe(28)
      expect(inMonth.some(c => c.dayOfMonth === 30)).toBe(false)
    })
    it('includes Feb 29 in a leap year', () => {
      const { cells } = buildMonthGrid(2024, 2)
      const inMonth = cells.filter(c => c.inMonth)
      expect(inMonth.length).toBe(29)
      expect(inMonth.some(c => c.dayOfMonth === 29)).toBe(true)
    })
  })

  describe('shiftMonth', () => {
    it('advances across year boundary', () => {
      expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    })
    it('retreats across year boundary', () => {
      expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 })
    })
    it('stays within year', () => {
      expect(shiftMonth(2026, 6, 3)).toEqual({ year: 2026, month: 9 })
    })
  })

  describe('todayString / nowTimeString', () => {
    it('produces a valid date and time', () => {
      expect(isValidDateString(todayString())).toBe(true)
      expect(isValidTimeString(nowTimeString())).toBe(true)
    })
  })
})