export { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
export type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
export { TRANSACTION_TYPES } from '@/shared/enums/transaction-type.enum.js';
export type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export const SORT_BY_FIELDS = ['date', 'amount', 'createdAt'] as const;
export type SortByField = (typeof SORT_BY_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];
