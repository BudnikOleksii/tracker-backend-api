import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { budgets, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import type { BudgetPeriod, BudgetStatus } from '@/shared/enums/budget.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import type { SortByField } from './budgets.constants.js';

export interface BudgetInfo {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  currencyCode: CurrencyCode;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  status: BudgetStatus;
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
  sortBy?: SortByField;
  sortOrder?: SortOrder;
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

const SORT_COLUMN_MAP = {
  amount: budgets.amount,
  startDate: budgets.startDate,
  endDate: budgets.endDate,
  createdAt: budgets.createdAt,
} as const;

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
    const {
      userId,
      page,
      pageSize,
      status,
      period,
      categoryId,
      currencyCode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

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
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(budgets)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(sortDirection(sortColumn)),
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

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toBudgetInfo(row);
  }

  async create(data: CreateBudgetData, tx?: DrizzleDb): Promise<BudgetInfo> {
    const db = tx ?? this.db;
    const result = await db
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

    const [row] = result;
    if (!row) {
      throw new Error('Insert did not return a row');
    }

    return this.toBudgetInfo(row);
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateBudgetData;
    tx?: DrizzleDb;
  }): Promise<BudgetInfo | null> {
    const { id, userId, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Partial<typeof budgets.$inferInsert> = {};

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

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toBudgetInfo(row);
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

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toBudgetInfo(row);
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

  async findActiveBudgetsWithFutureEndDate(now?: Date): Promise<BudgetInfo[]> {
    now = now ?? new Date();
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

  async getSpentAmountForAllActiveBudgets(
    now?: Date,
  ): Promise<{ budgetId: string; spent: string }[]> {
    now = now ?? new Date();

    const activeBudgets = this.db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        currencyCode: budgets.currencyCode,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
      })
      .from(budgets)
      .where(
        and(
          or(eq(budgets.status, 'ACTIVE'), eq(budgets.status, 'EXCEEDED')),
          lte(budgets.startDate, now),
          gte(budgets.endDate, now),
        ),
      )
      .as('active_budgets');

    const result = await this.db
      .select({
        budgetId: activeBudgets.id,
        spent: sql<string>`COALESCE(SUM(${transactions.amount}), '0.00')`,
      })
      .from(activeBudgets)
      .leftJoin(
        transactions,
        and(
          eq(transactions.userId, activeBudgets.userId),
          eq(transactions.currencyCode, activeBudgets.currencyCode),
          gte(transactions.date, activeBudgets.startDate),
          lte(transactions.date, activeBudgets.endDate),
          eq(transactions.type, 'EXPENSE'),
          sql`(${activeBudgets.categoryId} IS NULL OR ${transactions.categoryId} = ${activeBudgets.categoryId})`,
        ),
      )
      .groupBy(activeBudgets.id);

    return result as { budgetId: string; spent: string }[];
  }

  async bulkUpdateStatuses(updates: { id: string; status: BudgetStatus }[]): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const ids = updates.map(({ id }) => id);
    const caseWhen = sql.join(
      updates.map(
        ({ id, status }) => sql`WHEN ${budgets.id} = ${id} THEN ${status}::"BudgetStatus"`,
      ),
      sql` `,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(budgets)
        .set({ status: sql`CASE ${caseWhen} ELSE ${budgets.status} END` })
        .where(
          sql`${budgets.id} = ANY(ARRAY[${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )}]::uuid[])`,
        );
    });
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
