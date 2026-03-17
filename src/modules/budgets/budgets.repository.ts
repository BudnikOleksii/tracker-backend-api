import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { budgets, transactionCategories, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';

import type { BudgetPeriod, BudgetStatus, CurrencyCode } from './budgets.constants.js';

export interface BudgetInfo {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  currencyCode: CurrencyCode;
  period: string;
  startDate: Date;
  endDate: Date;
  status: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetListQuery {
  userId: string;
  page: number;
  pageSize: number;
  status?: BudgetStatus;
  period?: BudgetPeriod;
  categoryId?: string;
  currencyCode?: CurrencyCode;
}

export interface BudgetListResult {
  data: BudgetInfo[];
  total: number;
}

export interface CreateBudgetData {
  userId: string;
  categoryId?: string;
  amount: string;
  currencyCode: CurrencyCode;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  description?: string;
}

export interface UpdateBudgetData {
  amount?: string;
  categoryId?: string | null;
  endDate?: Date;
  description?: string | null;
}

export interface CategoryValidationInfo {
  id: string;
  type: string;
}

@Injectable()
export class BudgetRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async transaction<T>(callback: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findAll(query: BudgetListQuery): Promise<BudgetListResult> {
    const { userId, page, pageSize, status, period, categoryId, currencyCode } = query;

    const conditions: SQL[] = [eq(budgets.userId, userId)];

    if (status) {
      conditions.push(eq(budgets.status, status));
    }

    if (period) {
      conditions.push(eq(budgets.period, period));
    }

    if (categoryId) {
      conditions.push(eq(budgets.categoryId, categoryId));
    }

    if (currencyCode) {
      conditions.push(eq(budgets.currencyCode, currencyCode));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(budgets)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(budgets.createdAt),
      this.db.select({ count: count() }).from(budgets).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toBudgetInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(id: string, userId: string, tx?: DrizzleDb): Promise<BudgetInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toBudgetInfo(result[0] as typeof budgets.$inferSelect);
  }

  async create(data: CreateBudgetData, tx?: DrizzleDb): Promise<BudgetInfo> {
    const db = tx ?? this.db;
    const [budget] = await db
      .insert(budgets)
      .values({
        userId: data.userId,
        categoryId: data.categoryId,
        amount: data.amount,
        currencyCode: data.currencyCode,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      })
      .returning();

    return this.toBudgetInfo(budget as typeof budgets.$inferSelect);
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateBudgetData;
    tx?: DrizzleDb;
  }): Promise<BudgetInfo | null> {
    const { id, userId, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Record<string, unknown> = {};

    if (data.amount !== undefined) {
      updates.amount = data.amount;
    }

    if (data.categoryId !== undefined) {
      updates.categoryId = data.categoryId;
    }

    if (data.endDate !== undefined) {
      updates.endDate = data.endDate;
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    const result = await db
      .update(budgets)
      .set(updates)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toBudgetInfo(result[0] as typeof budgets.$inferSelect);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    return result.length > 0;
  }

  async findOverlapping(params: {
    userId: string;
    categoryId: string | null | undefined;
    currencyCode: CurrencyCode;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
    tx?: DrizzleDb;
  }): Promise<BudgetInfo | null> {
    const { userId, categoryId, currencyCode, startDate, endDate, excludeId, tx } = params;
    const db = tx ?? this.db;

    const conditions: SQL[] = [
      eq(budgets.userId, userId),
      eq(budgets.currencyCode, currencyCode),
      lte(budgets.startDate, endDate),
      gte(budgets.endDate, startDate),
    ];

    if (categoryId) {
      conditions.push(eq(budgets.categoryId, categoryId));
    } else {
      conditions.push(sql`${budgets.categoryId} IS NULL`);
    }

    if (excludeId) {
      conditions.push(sql`${budgets.id} != ${excludeId}`);
    }

    const result = await db
      .select()
      .from(budgets)
      .where(and(...conditions))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toBudgetInfo(result[0] as typeof budgets.$inferSelect);
  }

  async findCategoryByIdAndUserId(
    categoryId: string,
    userId: string,
    tx?: DrizzleDb,
  ): Promise<CategoryValidationInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select({
        id: transactionCategories.id,
        type: transactionCategories.type,
      })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, categoryId),
          eq(transactionCategories.userId, userId),
          sql`${transactionCategories.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as CategoryValidationInfo;
  }

  async getSpentAmount(params: {
    userId: string;
    categoryId: string | null;
    currencyCode: CurrencyCode;
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    const { userId, categoryId, currencyCode, startDate, endDate } = params;

    const conditions: SQL[] = [
      eq(transactions.userId, userId),
      eq(transactions.currencyCode, currencyCode),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate),
      eq(transactions.type, 'EXPENSE'),
    ];

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    const result = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), '0.00')`,
      })
      .from(transactions)
      .where(and(...conditions));

    return result[0]?.total ?? '0.00';
  }

  async findActiveBudgetsWithFutureEndDate(): Promise<BudgetInfo[]> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(budgets)
      .where(
        and(
          or(eq(budgets.status, 'ACTIVE'), eq(budgets.status, 'EXCEEDED')),
          lte(budgets.startDate, now),
          gte(budgets.endDate, now),
        ),
      );

    return result.map((row) => this.toBudgetInfo(row));
  }

  async batchUpdateStatuses(updates: { id: string; status: BudgetStatus }[]): Promise<void> {
    for (const { id, status } of updates) {
      await this.db.update(budgets).set({ status }).where(eq(budgets.id, id));
    }
  }

  private toBudgetInfo(row: typeof budgets.$inferSelect): BudgetInfo {
    return {
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      amount: row.amount,
      currencyCode: row.currencyCode,
      period: row.period,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
