import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';

import { buildCacheKey } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import {
  TransactionsAnalyticsRepository,
  type AnalyticsBaseQuery,
} from '@/modules/transactions-analytics/transactions-analytics.repository.js';
import type { Granularity } from '@/modules/transactions-analytics/dtos/trends-query.dto.js';
import type {
  CategoryBreakdownResponse,
  DailySpendingResponse,
  SummaryResponse,
  TopCategoriesResponse,
  TrendsResponse,
} from '@/modules/transactions-analytics/transactions-analytics.types.js';

const CACHE_MODULE = 'transactions-analytics';
const TTL_DEFAULT = 300;
const TTL_TRENDS = 600;

interface BaseParams {
  userId: string;
  currencyCode: CurrencyCode;
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  categoryId?: string;
}

interface TrendsParams extends BaseParams {
  granularity: Granularity;
}

interface TopCategoriesParams extends BaseParams {
  limit?: number;
}

interface DailySpendingParams {
  userId: string;
  currencyCode: CurrencyCode;
  year: number;
  month: number;
  type?: TransactionType;
}

@Injectable()
export class TransactionsAnalyticsService {
  constructor(
    private readonly transactionsAnalyticsRepository: TransactionsAnalyticsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getSummary(params: BaseParams): Promise<SummaryResponse> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: params.userId,
      operation: 'summary',
      params,
    });

    return this.cacheService.wrap(
      key,
      async () => {
        const query = this.buildQuery(params);
        const result = await this.transactionsAnalyticsRepository.getSummary(query);

        return {
          ...result,
          currencyCode: params.currencyCode,
          dateFrom: query.dateFrom.toISOString(),
          dateTo: query.dateTo.toISOString(),
        };
      },
      TTL_DEFAULT,
    );
  }

  async getCategoryBreakdown(params: BaseParams): Promise<CategoryBreakdownResponse> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: params.userId,
      operation: 'category-breakdown',
      params,
    });

    return this.cacheService.wrap(
      key,
      async () => {
        const query = this.buildQuery(params);
        const rows = await this.transactionsAnalyticsRepository.getCategoryBreakdown(query);
        const grandTotal = rows.reduce((sum, row) => sum.plus(row.total), new Decimal(0));

        return {
          currencyCode: params.currencyCode,
          dateFrom: query.dateFrom.toISOString(),
          dateTo: query.dateTo.toISOString(),
          breakdown: rows.map((row) => ({
            ...row,
            percentage: grandTotal.gt(0)
              ? new Decimal(row.total).div(grandTotal).times(100).toDecimalPlaces(2).toNumber()
              : 0,
          })),
        };
      },
      TTL_DEFAULT,
    );
  }

  async getTrends(params: TrendsParams): Promise<TrendsResponse> {
    const query = this.buildQuery(params);
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: params.userId,
      operation: 'trends',
      params,
    });

    const rows = await this.cacheService.wrap(
      key,
      () => this.transactionsAnalyticsRepository.getTrends(query, params.granularity),
      TTL_TRENDS,
    );

    return {
      currencyCode: params.currencyCode,
      granularity: params.granularity,
      periods: rows.map((row) => ({
        ...row,
        periodStart: this.formatDate(row.periodStart),
        periodEnd: this.computePeriodEnd(row.periodStart, params.granularity),
      })),
    };
  }

  async getTopCategories(params: TopCategoriesParams): Promise<TopCategoriesResponse> {
    const query = this.buildQuery(params);
    const limit = params.limit ?? 5;
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: params.userId,
      operation: 'top-categories',
      params: { ...params, limit },
    });

    const rows = await this.cacheService.wrap(
      key,
      () => this.transactionsAnalyticsRepository.getTopCategories(query, limit),
      TTL_DEFAULT,
    );

    const grandTotal = rows.reduce((sum, row) => sum.plus(row.total), new Decimal(0));

    return {
      currencyCode: params.currencyCode,
      categories: rows.map((row, index) => ({
        rank: index + 1,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        total: row.total,
        percentage: grandTotal.gt(0)
          ? new Decimal(row.total).div(grandTotal).times(100).toDecimalPlaces(2).toNumber()
          : 0,
        transactionCount: row.transactionCount,
      })),
    };
  }

  async getDailySpending(params: DailySpendingParams): Promise<DailySpendingResponse> {
    const dateFrom = new Date(Date.UTC(params.year, params.month - 1, 1));
    const dateTo = new Date(Date.UTC(params.year, params.month, 0, 23, 59, 59, 999));

    const query: AnalyticsBaseQuery = {
      userId: params.userId,
      currencyCode: params.currencyCode,
      dateFrom,
      dateTo,
      type: params.type,
    };

    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: params.userId,
      operation: 'daily-spending',
      params,
    });

    const rows = await this.cacheService.wrap(
      key,
      () => this.transactionsAnalyticsRepository.getDailyTotals(query),
      TTL_DEFAULT,
    );

    const dayMap = new Map(rows.map((row) => [row.date, row]));
    const daysInMonth = new Date(params.year, params.month, 0).getDate();
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${params.year}-${String(params.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const existing = dayMap.get(dateStr);
      days.push({
        date: dateStr,
        total: existing?.total ?? '0.00',
        transactionCount: existing?.transactionCount ?? 0,
      });
    }

    return {
      currencyCode: params.currencyCode,
      year: params.year,
      month: params.month,
      days,
    };
  }

  private buildQuery(params: BaseParams): AnalyticsBaseQuery {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    return {
      userId: params.userId,
      currencyCode: params.currencyCode,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : startOfMonth,
      dateTo: params.dateTo ? new Date(params.dateTo) : now,
      type: params.type,
      categoryId: params.categoryId,
    };
  }

  private computePeriodEnd(periodStart: string, granularity: Granularity): string {
    const date = new Date(periodStart);
    if (granularity === 'monthly') {
      const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

      return this.formatDate(end.toISOString());
    }
    const end = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);

    return this.formatDate(end.toISOString());
  }

  private formatDate(isoOrTimestamp: string): string {
    const [date] = new Date(isoOrTimestamp).toISOString().split('T');

    return date ?? '';
  }
}
