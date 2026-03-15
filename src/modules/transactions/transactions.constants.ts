import { currencyCodeEnum, transactionTypeEnum } from '@/database/schemas/enums.js';

export const TRANSACTION_TYPES = transactionTypeEnum.enumValues;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CURRENCY_CODES = currencyCodeEnum.enumValues;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];
