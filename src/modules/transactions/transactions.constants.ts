export const CACHE_MODULE = 'transactions';

export const SORT_BY_FIELDS = ['date', 'amount', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
