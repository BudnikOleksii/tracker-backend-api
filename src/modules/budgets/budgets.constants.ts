export const SORT_BY_FIELDS = ['amount', 'startDate', 'endDate', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
