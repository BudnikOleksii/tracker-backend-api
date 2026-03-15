import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, ne } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { transactionCategories, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';

import type { TransactionType } from './transaction-categories.constants.js';

export interface CategoryInfo {
  id: string;
  name: string;
  type: string;
  parentCategoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryListQuery {
  userId: string;
  page: number;
  pageSize: number;
  type?: TransactionType;
  parentCategoryId?: string;
  root?: boolean;
}

export interface CategoryListResult {
  data: CategoryInfo[];
  total: number;
}

export interface CreateCategoryData {
  userId: string;
  name: string;
  type: TransactionType;
  parentCategoryId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  parentCategoryId?: string | null;
}

@Injectable()
export class TransactionCategoryRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: CategoryListQuery): Promise<CategoryListResult> {
    const { userId, page, pageSize, type, parentCategoryId, root } = query;

    const conditions: SQL[] = [
      eq(transactionCategories.userId, userId),
      isNull(transactionCategories.deletedAt),
    ];

    if (type) {
      conditions.push(eq(transactionCategories.type, type));
    }

    if (parentCategoryId) {
      conditions.push(eq(transactionCategories.parentCategoryId, parentCategoryId));
    }

    if (root) {
      conditions.push(isNull(transactionCategories.parentCategoryId));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(transactionCategories)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(transactionCategories.name),
      this.db.select({ count: count() }).from(transactionCategories).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toCategoryInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async transaction<T>(callback: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findById(id: string, userId: string, tx?: DrizzleDb): Promise<CategoryInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.id, id),
          eq(transactionCategories.userId, userId),
          isNull(transactionCategories.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toCategoryInfo(result[0] as typeof transactionCategories.$inferSelect);
  }

  async existsByNameTypeAndParent(
    params: {
      userId: string;
      name: string;
      type: TransactionType;
      parentCategoryId: string | null;
      excludeId?: string;
    },
    tx?: DrizzleDb,
  ): Promise<boolean> {
    const db = tx ?? this.db;
    const { userId, name, type, parentCategoryId, excludeId } = params;
    const conditions: SQL[] = [
      eq(transactionCategories.userId, userId),
      eq(transactionCategories.name, name),
      eq(transactionCategories.type, type),
      isNull(transactionCategories.deletedAt),
    ];

    if (parentCategoryId) {
      conditions.push(eq(transactionCategories.parentCategoryId, parentCategoryId));
    } else {
      conditions.push(isNull(transactionCategories.parentCategoryId));
    }

    if (excludeId) {
      conditions.push(ne(transactionCategories.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(transactionCategories)
      .where(and(...conditions));

    return (result[0]?.count ?? 0) > 0;
  }

  async create(data: CreateCategoryData, tx?: DrizzleDb): Promise<CategoryInfo> {
    const db = tx ?? this.db;
    const [category] = await db
      .insert(transactionCategories)
      .values({
        userId: data.userId,
        name: data.name,
        type: data.type,
        parentCategoryId: data.parentCategoryId,
      })
      .returning();

    return this.toCategoryInfo(category as typeof transactionCategories.$inferSelect);
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateCategoryData;
    tx?: DrizzleDb;
  }): Promise<CategoryInfo | null> {
    const { id, userId, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.parentCategoryId !== undefined) {
      updates.parentCategoryId = data.parentCategoryId;
    }

    const result = await db
      .update(transactionCategories)
      .set(updates)
      .where(
        and(
          eq(transactionCategories.id, id),
          eq(transactionCategories.userId, userId),
          isNull(transactionCategories.deletedAt),
        ),
      )
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toCategoryInfo(result[0] as typeof transactionCategories.$inferSelect);
  }

  async softDelete(id: string, userId: string, tx?: DrizzleDb): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .update(transactionCategories)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(transactionCategories.id, id),
          eq(transactionCategories.userId, userId),
          isNull(transactionCategories.deletedAt),
        ),
      )
      .returning();

    return result.length > 0;
  }

  async hasTransactions(categoryId: string, tx?: DrizzleDb): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));

    return (result[0]?.count ?? 0) > 0;
  }

  async hasActiveChildren(categoryId: string, tx?: DrizzleDb): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .select({ count: count() })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.parentCategoryId, categoryId),
          isNull(transactionCategories.deletedAt),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }

  async isDescendantOf(
    categoryId: string,
    potentialAncestorId: string,
    tx?: DrizzleDb,
  ): Promise<boolean> {
    const db = tx ?? this.db;
    let currentId: string | null = categoryId;

    while (currentId) {
      if (currentId === potentialAncestorId) {
        return true;
      }

      const result = await db
        .select({ parentCategoryId: transactionCategories.parentCategoryId })
        .from(transactionCategories)
        .where(
          and(eq(transactionCategories.id, currentId), isNull(transactionCategories.deletedAt)),
        )
        .limit(1);

      currentId = result[0]?.parentCategoryId ?? null;
    }

    return false;
  }

  private toCategoryInfo(row: typeof transactionCategories.$inferSelect): CategoryInfo {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      parentCategoryId: row.parentCategoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
