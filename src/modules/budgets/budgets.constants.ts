import { budgetPeriodEnum, budgetStatusEnum, currencyCodeEnum } from '@/database/schemas/enums.js';

export const BUDGET_PERIODS = budgetPeriodEnum.enumValues;

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

export const BUDGET_STATUSES = budgetStatusEnum.enumValues;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export const CURRENCY_CODES = currencyCodeEnum.enumValues;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];
