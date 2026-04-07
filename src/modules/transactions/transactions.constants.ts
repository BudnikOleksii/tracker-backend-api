export { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
export type { SortOrder } from '@/shared/constants/sort.constants.js';

export const SORT_BY_FIELDS = ['date', 'amount', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];
