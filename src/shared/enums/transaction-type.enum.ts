import { transactionTypeEnum } from '@/database/schemas/enums.js';

export const TRANSACTION_TYPES = transactionTypeEnum.enumValues;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
