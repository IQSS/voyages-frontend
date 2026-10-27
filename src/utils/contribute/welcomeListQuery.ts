import type { Dayjs } from 'dayjs';

export type DateRange = [Dayjs | null, Dayjs | null] | null;

/**
 * The search and date range of the Welcome table, added to its list query.
 * A whole number is a Voyage ID, matched exactly; other text is a search.
 * Dates cover whole days: from the start of the first to the end of the last.
 */
export const addWelcomeFilters = (
  query: URLSearchParams,
  search: string,
  dateRange: DateRange,
) => {
  const text = search.trim();
  if (/^\d+$/.test(text)) query.set('voyage_id', text);
  else if (text) query.set('search', text);
  const [from, to] = dateRange ?? [null, null];
  if (from) query.set('dateFrom', from.startOf('day').toISOString());
  if (to) query.set('dateTo', to.endOf('day').toISOString());
  return query;
};
