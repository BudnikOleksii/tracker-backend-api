import { budgetPeriodEnum, budgetStatusEnum } from '@/database/schemas/enums.js';

export const BUDGET_PERIODS = budgetPeriodEnum.enumValues;

export type BudgetPeriod = (typeof BUDGET_PERIODS)[number];

export const BUDGET_STATUSES = budgetStatusEnum.enumValues;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];
