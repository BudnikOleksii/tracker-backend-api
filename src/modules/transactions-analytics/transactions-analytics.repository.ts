import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { transactionCategories, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import type { Granularity } from './dtos/trends-query.dto.js';

export interface AnalyticsBaseQuery {
  userId: string;
  currencyCode?: CurrencyCode;
  dateFrom: Date;
  dateTo: Date;
  type?: TransactionType;
  categoryId?: string;
}

export interface SummaryResult {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
}

export interface CategoryBreakdownRow {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  total: string;
  transactionCount: number;
}

export interface TrendRow {
  periodStart: string;
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
}

export interface DailyTotalRow {
  date: string;
  total: string;
  transactionCount: number;
}

@Injectable()
export class TransactionsAnalyticsRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async getSummary(query: AnalyticsBaseQuery): Promise<SummaryResult> {
    const conditions = this.buildBaseConditions(query);

    const result = await this.db
      .select({
        totalIncome:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END), 0)`.as(
            'totalIncome',
          ),
        totalExpenses:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END), 0)`.as(
            'totalExpenses',
          ),
        netBalance:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`.as(
            'netBalance',
          ),
        transactionCount: count(),
      })
      .from(transactions)
      .where(and(...conditions));

    const [row] = result;
    if (!row) {
      return {
        totalIncome: '0.00',
        totalExpenses: '0.00',
        netBalance: '0.00',
        transactionCount: 0,
      };
    }

    return {
      totalIncome: this.formatAmount(row.totalIncome),
      totalExpenses: this.formatAmount(row.totalExpenses),
      netBalance: this.formatAmount(row.netBalance),
      transactionCount: row.transactionCount,
    };
  }

  async getCategoryBreakdown(query: AnalyticsBaseQuery): Promise<CategoryBreakdownRow[]> {
    const conditions = this.buildBaseConditions(query);

    const rows = await this.db
      .select({
        categoryId: transactions.categoryId,
        categoryName: transactionCategories.name,
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
        transactionCount: count(),
      })
      .from(transactions)
      .innerJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId, transactionCategories.name, transactions.type)
      .orderBy(sql`total DESC`);

    return rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      type: row.type,
      total: this.formatAmount(row.total),
      transactionCount: row.transactionCount,
    }));
  }

  async getTrends(query: AnalyticsBaseQuery, granularity: Granularity): Promise<TrendRow[]> {
    const conditions = this.buildBaseConditions(query);
    const truncUnit = granularity === 'weekly' ? 'week' : 'month';
    const periodExpr = sql`date_trunc(${truncUnit}, ${transactions.date})`;

    const rows = await this.db
      .select({
        periodStart: sql<string>`${periodExpr}`.as('periodStart'),
        totalIncome:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE 0 END), 0)`.as(
            'totalIncome',
          ),
        totalExpenses:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'EXPENSE' THEN ${transactions.amount} ELSE 0 END), 0)`.as(
            'totalExpenses',
          ),
        netBalance:
          sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`.as(
            'netBalance',
          ),
        transactionCount: count(),
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(periodExpr)
      .orderBy(periodExpr);

    return rows.map((row) => ({
      periodStart: row.periodStart,
      totalIncome: this.formatAmount(row.totalIncome),
      totalExpenses: this.formatAmount(row.totalExpenses),
      netBalance: this.formatAmount(row.netBalance),
      transactionCount: row.transactionCount,
    }));
  }

  async getTopCategories(
    query: AnalyticsBaseQuery,
    limit: number,
  ): Promise<CategoryBreakdownRow[]> {
    const conditions = this.buildBaseConditions(query);

    const rows = await this.db
      .select({
        categoryId: transactions.categoryId,
        categoryName: transactionCategories.name,
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
        transactionCount: count(),
      })
      .from(transactions)
      .innerJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
      .where(and(...conditions))
      .groupBy(transactions.categoryId, transactionCategories.name, transactions.type)
      .orderBy(sql`total DESC`)
      .limit(limit);

    return rows.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      type: row.type,
      total: this.formatAmount(row.total),
      transactionCount: row.transactionCount,
    }));
  }

  async getDailyTotals(query: AnalyticsBaseQuery): Promise<DailyTotalRow[]> {
    const conditions = this.buildBaseConditions(query);

    const rows = await this.db
      .select({
        date: sql<string>`${transactions.date}::date`.as('day'),
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`.as('total'),
        transactionCount: count(),
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(sql`day`)
      .orderBy(sql`day`);

    return rows.map((row) => ({
      date: row.date,
      total: this.formatAmount(row.total),
      transactionCount: row.transactionCount,
    }));
  }

  private buildBaseConditions(query: AnalyticsBaseQuery): SQL[] {
    const conditions: SQL[] = [
      eq(transactions.userId, query.userId),
      gte(transactions.date, query.dateFrom),
      lte(transactions.date, query.dateTo),
    ];

    if (query.currencyCode) {
      conditions.push(eq(transactions.currencyCode, query.currencyCode));
    }

    if (query.type) {
      conditions.push(eq(transactions.type, query.type));
    }

    if (query.categoryId) {
      conditions.push(eq(transactions.categoryId, query.categoryId));
    }

    return conditions;
  }

  private formatAmount(value: string): string {
    const [integerPart, fractionalPart = ''] = value.split('.');
    const normalizedFractionalPart = `${fractionalPart}00`.slice(0, 2);

    return `${integerPart}.${normalizedFractionalPart}`;
  }
}
