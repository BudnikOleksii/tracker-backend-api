export const SORT_BY_FIELDS = ['email', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
