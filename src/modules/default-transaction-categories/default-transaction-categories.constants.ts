export const SORT_BY_FIELDS = ['name', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
