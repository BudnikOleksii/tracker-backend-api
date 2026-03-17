import {
  currencyCodeEnum,
  recurringFrequencyEnum,
  recurringTransactionStatusEnum,
  transactionTypeEnum,
} from '@/database/schemas/enums.js';

export const TRANSACTION_TYPES = transactionTypeEnum.enumValues;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CURRENCY_CODES = currencyCodeEnum.enumValues;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const RECURRING_FREQUENCIES = recurringFrequencyEnum.enumValues;

export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const RECURRING_TRANSACTION_STATUSES = recurringTransactionStatusEnum.enumValues;

export type RecurringTransactionStatus = (typeof RECURRING_TRANSACTION_STATUSES)[number];

export const CACHE_MODULE = 'recurring-transactions';
