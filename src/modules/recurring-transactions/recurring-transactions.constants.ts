export const CACHE_MODULE = 'recurring-transactions';

export const SORT_BY_FIELDS = ['amount', 'startDate', 'nextOccurrenceDate', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
