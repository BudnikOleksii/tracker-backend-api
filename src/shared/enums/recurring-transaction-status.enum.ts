import { recurringTransactionStatusEnum } from '@/database/schemas/enums.js';

export const RECURRING_TRANSACTION_STATUSES = recurringTransactionStatusEnum.enumValues;

export type RecurringTransactionStatus = (typeof RECURRING_TRANSACTION_STATUSES)[number];
