import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import type { Granularity } from './dtos/trends-query.dto.js';

export interface SummaryResponse {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
  currencyCode: CurrencyCode;
  dateFrom: string;
  dateTo: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  total: string;
  transactionCount: number;
  percentage: number;
}

export interface CategoryBreakdownResponse {
  currencyCode: CurrencyCode;
  dateFrom: string;
  dateTo: string;
  breakdown: CategoryBreakdownItem[];
}

export interface TrendPeriod {
  periodStart: string;
  periodEnd: string;
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
}

export interface TrendsResponse {
  currencyCode: CurrencyCode;
  granularity: Granularity;
  periods: TrendPeriod[];
}

export interface TopCategoryItem {
  rank: number;
  categoryId: string;
  categoryName: string;
  total: string;
  percentage: number;
  transactionCount: number;
}

export interface TopCategoriesResponse {
  currencyCode: CurrencyCode;
  categories: TopCategoryItem[];
}

export interface DailySpendingDay {
  date: string;
  total: string;
  transactionCount: number;
}

export interface DailySpendingResponse {
  currencyCode: CurrencyCode;
  year: number;
  month: number;
  days: DailySpendingDay[];
}
