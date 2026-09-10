import {
  formatRelativeTime,
  groupPracticesByDate,
  isToday,
  isTomorrow,
} from '../../src/utils/mobileDateUtils';
import { Practice } from '../../src/types';

const makePractice = (overrides: Partial<Practice>): Practice => ({
  id: 'practice-1',
  name: 'Practice',
  location: 'Field A',
  coach: 'Coach',
  headCoach: 'Head Coach',
  sport: 'Football',
  contactInfo: '123',
  date: '2026-09-10',
  teamId: 'team-1',
  notes: '',
  checklists: [],
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  ...overrides,
});

describe('formatRelativeTime', () => {
  const now = Date.now();
  const DAY = 1000 * 60 * 60 * 24;

  it('returns Today for the current day', () => {
    expect(formatRelativeTime(new Date(now).toISOString())).toBe('Today');
  });

  it('labels a future date as Tomorrow', () => {
    expect(formatRelativeTime(new Date(now + DAY).toISOString())).toBe('Tomorrow');
  });

  it('labels a past date as Yesterday', () => {
    expect(formatRelativeTime(new Date(now - DAY).toISOString())).toBe('Yesterday');
  });

  it('labels future dates with "In X ..."', () => {
    expect(formatRelativeTime(new Date(now + 14 * DAY).toISOString())).toMatch(/^In /);
  });

  it('labels past dates with "... ago"', () => {
    expect(formatRelativeTime(new Date(now - 14 * DAY).toISOString())).toMatch(/ ago$/);
  });
});

describe('groupPracticesByDate (per-year grouping)', () => {
  it('keeps the same month/day in different years as distinct groups', () => {
    const groups = groupPracticesByDate([
      makePractice({ id: 'a', date: '2025-06-15' }),
      makePractice({ id: 'b', date: '2026-06-15' }),
    ]);

    const keys = Object.keys(groups);
    expect(keys).toContain('2025-06-15');
    expect(keys).toContain('2026-06-15');
    expect(keys.length).toBe(2);
  });
});

describe('isToday / isTomorrow (local date, UTC-safe)', () => {
  it('returns true for today and false for a different day', () => {
    const localToday = new Date();
    const localKey = [
      localToday.getFullYear(),
      String(localToday.getMonth() + 1).padStart(2, '0'),
      String(localToday.getDate()).padStart(2, '0'),
    ].join('-');

    expect(isToday(localKey)).toBe(true);
    expect(isToday('2000-01-01')).toBe(false);
  });

  it('computes tomorrow from local date components', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const key = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-');

    expect(isTomorrow(key)).toBe(true);
  });
});