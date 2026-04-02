export const SORT_BY_FIELDS = ['date', 'amount', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];
