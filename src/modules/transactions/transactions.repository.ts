import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNull, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { transactionCategories, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';

import type { CurrencyCode, TransactionType } from './transactions.constants.js';

export interface TransactionInfo {
  id: string;
  categoryId: string;
  type: string;
  amount: string;
  currencyCode: string;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionListQuery {
  userId: string;
  page: number;
  pageSize: number;
  type?: TransactionType;
  categoryId?: string;
  currencyCode?: CurrencyCode;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionListResult {
  data: TransactionInfo[];
  total: number;
}

export interface CreateTransactionData {
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  date: Date;
  description?: string;
}

export interface UpdateTransactionData {
  categoryId?: string;
  type?: TransactionType;
  amount?: string;
  currencyCode?: CurrencyCode;
  date?: Date;
  description?: string;
}

export interface CategoryValidationInfo {
  id: string;
  type: string;
}

@Injectable()
export class TransactionRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: TransactionListQuery): Promise<TransactionListResult> {
    const { userId, page, pageSize, type, categoryId, currencyCode, dateFrom, dateTo } = query;

    const conditions: SQL[] = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];

    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    if (currencyCode) {
      conditions.push(eq(transactions.currencyCode, currencyCode));
    }

    if (dateFrom) {
      conditions.push(gte(transactions.date, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(transactions.date, new Date(dateTo)));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(transactions.date),
      this.db.select({ count: count() }).from(transactions).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toTransactionInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(id: string, userId: string): Promise<TransactionInfo | null> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toTransactionInfo(result[0] as typeof transactions.$inferSelect);
  }

  async create(data: CreateTransactionData): Promise<TransactionInfo> {
    const [transaction] = await this.db
      .insert(transactions)
      .values({
        userId: data.userId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        currencyCode: data.currencyCode,
        date: data.date,
        description: data.description,
      })
      .returning();

    return this.toTransactionInfo(transaction as typeof transactions.$inferSelect);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateTransactionData,
  ): Promise<TransactionInfo | null> {
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

    if (data.date !== undefined) {
      updates.date = data.date;
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    const result = await this.db
      .update(transactions)
      .set(updates)
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
        ),
      )
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toTransactionInfo(result[0] as typeof transactions.$inferSelect);
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(transactions.id, id),
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
        ),
      )
      .returning();

    return result.length > 0;
  }

  async findCategoryByIdAndUserId(
    categoryId: string,
    userId: string,
  ): Promise<CategoryValidationInfo | null> {
    const result = await this.db
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

  private toTransactionInfo(row: typeof transactions.$inferSelect): TransactionInfo {
    return {
      id: row.id,
      categoryId: row.categoryId,
      type: row.type,
      amount: row.amount,
      currencyCode: row.currencyCode,
      date: row.date,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
