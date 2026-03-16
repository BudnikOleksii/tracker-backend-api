import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import {
  recurringTransactions,
  transactionCategories,
  transactions,
} from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';

import type {
  CurrencyCode,
  RecurringFrequency,
  RecurringTransactionStatus,
  TransactionType,
} from './recurring-transactions.constants.js';

export interface RecurringTransactionInfo {
  id: string;
  userId: string;
  categoryId: string;
  type: string;
  amount: string;
  currencyCode: string;
  description: string | null;
  frequency: string;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextOccurrenceDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransactionListQuery {
  userId: string;
  page: number;
  pageSize: number;
  status?: RecurringTransactionStatus;
  type?: TransactionType;
  categoryId?: string;
  currencyCode?: CurrencyCode;
  frequency?: RecurringFrequency;
}

export interface RecurringTransactionListResult {
  data: RecurringTransactionInfo[];
  total: number;
}

export interface CreateRecurringTransactionData {
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  description?: string;
  frequency: RecurringFrequency;
  interval: number;
  startDate: Date;
  endDate?: Date;
  nextOccurrenceDate: Date;
}

export interface UpdateRecurringTransactionData {
  categoryId?: string;
  type?: TransactionType;
  amount?: string;
  currencyCode?: CurrencyCode;
  description?: string;
  frequency?: RecurringFrequency;
  interval?: number;
  startDate?: Date;
  endDate?: Date;
  nextOccurrenceDate?: Date;
  status?: RecurringTransactionStatus;
}

export interface CategoryValidationInfo {
  id: string;
  type: string;
}

export interface CreateMaterializedTransactionData {
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  date: Date;
  description?: string;
  recurringTransactionId: string;
}

@Injectable()
export class RecurringTransactionsRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: RecurringTransactionListQuery): Promise<RecurringTransactionListResult> {
    const { userId, page, pageSize, status, type, categoryId, currencyCode, frequency } = query;

    const conditions: SQL[] = [eq(recurringTransactions.userId, userId)];

    if (status) {
      conditions.push(eq(recurringTransactions.status, status));
    }

    if (type) {
      conditions.push(eq(recurringTransactions.type, type));
    }

    if (categoryId) {
      conditions.push(eq(recurringTransactions.categoryId, categoryId));
    }

    if (currencyCode) {
      conditions.push(eq(recurringTransactions.currencyCode, currencyCode));
    }

    if (frequency) {
      conditions.push(eq(recurringTransactions.frequency, frequency));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(recurringTransactions)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(recurringTransactions.createdAt),
      this.db.select({ count: count() }).from(recurringTransactions).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toRecurringTransactionInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async transaction<T>(callback: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findById(
    id: string,
    userId: string,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurringTransactions)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toRecurringTransactionInfo(result[0] as typeof recurringTransactions.$inferSelect);
  }

  async create(
    data: CreateRecurringTransactionData,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo> {
    const db = tx ?? this.db;
    const [record] = await db
      .insert(recurringTransactions)
      .values({
        userId: data.userId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        currencyCode: data.currencyCode,
        description: data.description,
        frequency: data.frequency,
        interval: data.interval,
        startDate: data.startDate,
        endDate: data.endDate,
        nextOccurrenceDate: data.nextOccurrenceDate,
      })
      .returning();

    return this.toRecurringTransactionInfo(record as typeof recurringTransactions.$inferSelect);
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateRecurringTransactionData;
    tx?: DrizzleDb;
  }): Promise<RecurringTransactionInfo | null> {
    const { id, userId, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Record<string, unknown> = {};

    if (data.categoryId !== undefined) {
      updates.categoryId = data.categoryId;
    }
    if (data.type !== undefined) {
      updates.type = data.type;
    }
    if (data.amount !== undefined) {
      updates.amount = data.amount;
    }
    if (data.currencyCode !== undefined) {
      updates.currencyCode = data.currencyCode;
    }
    if (data.description !== undefined) {
      updates.description = data.description;
    }
    if (data.frequency !== undefined) {
      updates.frequency = data.frequency;
    }
    if (data.interval !== undefined) {
      updates.interval = data.interval;
    }
    if (data.startDate !== undefined) {
      updates.startDate = data.startDate;
    }
    if (data.endDate !== undefined) {
      updates.endDate = data.endDate;
    }
    if (data.nextOccurrenceDate !== undefined) {
      updates.nextOccurrenceDate = data.nextOccurrenceDate;
    }
    if (data.status !== undefined) {
      updates.status = data.status;
    }

    const result = await db
      .update(recurringTransactions)
      .set(updates)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toRecurringTransactionInfo(result[0] as typeof recurringTransactions.$inferSelect);
  }

  async findDueRecurringTransactions(
    userId: string,
    today: Date,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactions.status, 'ACTIVE'),
          lte(recurringTransactions.nextOccurrenceDate, today),
        ),
      );

    return result.map((row) => this.toRecurringTransactionInfo(row));
  }

  async findAllDueRecurringTransactions(
    today: Date,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.status, 'ACTIVE'),
          lte(recurringTransactions.nextOccurrenceDate, today),
        ),
      );

    return result.map((row) => this.toRecurringTransactionInfo(row));
  }

  async createTransaction(data: CreateMaterializedTransactionData, tx?: DrizzleDb): Promise<void> {
    const db = tx ?? this.db;
    await db.insert(transactions).values({
      userId: data.userId,
      categoryId: data.categoryId,
      type: data.type,
      amount: data.amount,
      currencyCode: data.currencyCode,
      date: data.date,
      description: data.description,
      recurringTransactionId: data.recurringTransactionId,
    });
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
          isNull(transactionCategories.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as CategoryValidationInfo;
  }

  private toRecurringTransactionInfo(
    row: typeof recurringTransactions.$inferSelect,
  ): RecurringTransactionInfo {
    return {
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      type: row.type,
      amount: row.amount,
      currencyCode: row.currencyCode,
      description: row.description,
      frequency: row.frequency,
      interval: row.interval,
      startDate: row.startDate,
      endDate: row.endDate,
      nextOccurrenceDate: row.nextOccurrenceDate,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
