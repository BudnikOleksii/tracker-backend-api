import { currencyCodeEnum } from '@/database/schemas/enums.js';

export const CURRENCY_CODES = currencyCodeEnum.enumValues;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];
