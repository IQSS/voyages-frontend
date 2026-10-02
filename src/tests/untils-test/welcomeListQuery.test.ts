import dayjs from 'dayjs';
import { describe, expect, test } from 'vitest';

import { addWelcomeFilters } from '@/utils/contribute/welcomeListQuery';

describe('addWelcomeFilters', () => {
  test('adds the trimmed search and whole-day date bounds', () => {
    const query = addWelcomeFilters(
      new URLSearchParams('status=0'),
      '  Chile ',
      [dayjs('2026-08-17T15:30:00'), dayjs('2026-08-18T09:00:00')],
    );
    expect(query.get('status')).toBe('0');
    expect(query.get('search')).toBe('Chile');
    expect(query.has('voyage_id')).toBe(false);
    expect(query.get('dateFrom')).toBe(
      dayjs('2026-08-17').startOf('day').toISOString(),
    );
    expect(query.get('dateTo')).toBe(
      dayjs('2026-08-18').endOf('day').toISOString(),
    );
  });

  test('a whole number is a Voyage ID, not a text search', () => {
    const query = addWelcomeFilters(new URLSearchParams(), ' 1234 ', null);
    expect(query.get('voyage_id')).toBe('1234');
    expect(query.has('search')).toBe(false);
  });

  test('leaves out what is empty, including one open end of the range', () => {
    const query = addWelcomeFilters(new URLSearchParams(), '   ', [
      null,
      dayjs('2026-08-18'),
    ]);
    expect(query.has('search')).toBe(false);
    expect(query.has('dateFrom')).toBe(false);
    expect(query.has('dateTo')).toBe(true);
    expect(addWelcomeFilters(new URLSearchParams(), '', null).toString()).toBe(
      '',
    );
  });
});
