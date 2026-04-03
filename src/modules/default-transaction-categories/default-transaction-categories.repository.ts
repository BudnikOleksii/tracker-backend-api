import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNull, ne } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { defaultTransactionCategories } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export interface DefaultCategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
  parentDefaultTransactionCategoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DefaultCategoryListQuery {
  page: number;
  pageSize: number;
  type?: TransactionType;
  root?: boolean;
}

export interface DefaultCategoryListResult {
  data: DefaultCategoryInfo[];
  total: number;
}

export interface CreateDefaultCategoryData {
  name: string;
  type: TransactionType;
  parentDefaultTransactionCategoryId?: string;
}

export interface UpdateDefaultCategoryData {
  name?: string;
  parentDefaultTransactionCategoryId?: string | null;
}

@Injectable()
export class DefaultTransactionCategoryRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: DefaultCategoryListQuery): Promise<DefaultCategoryListResult> {
    const { page, pageSize, type, root } = query;

    const conditions: SQL[] = [isNull(defaultTransactionCategories.deletedAt)];

    if (type) {
      conditions.push(eq(defaultTransactionCategories.type, type));
    }

    if (root) {
      conditions.push(isNull(defaultTransactionCategories.parentDefaultTransactionCategoryId));
    }

    const whereClause = and(...conditions);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(defaultTransactionCategories)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(defaultTransactionCategories.name),
      this.db.select({ count: count() }).from(defaultTransactionCategories).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toDefaultCategoryInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(id: string, tx?: DrizzleDb): Promise<DefaultCategoryInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(defaultTransactionCategories)
      .where(
        and(
          eq(defaultTransactionCategories.id, id),
          isNull(defaultTransactionCategories.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDefaultCategoryInfo(
      result[0] as typeof defaultTransactionCategories.$inferSelect,
    );
  }

  async findAllActive(tx?: DrizzleDb): Promise<DefaultCategoryInfo[]> {
    const db = tx ?? this.db;
    const result = await db
      .select()
      .from(defaultTransactionCategories)
      .where(isNull(defaultTransactionCategories.deletedAt))
      .orderBy(defaultTransactionCategories.name);

    return result.map((row) => this.toDefaultCategoryInfo(row));
  }

  async transaction<T>(callback: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async create(data: CreateDefaultCategoryData, tx?: DrizzleDb): Promise<DefaultCategoryInfo> {
    const db = tx ?? this.db;
    const [category] = await db
      .insert(defaultTransactionCategories)
      .values({
        name: data.name,
        type: data.type,
        parentDefaultTransactionCategoryId: data.parentDefaultTransactionCategoryId,
      })
      .returning();

    return this.toDefaultCategoryInfo(category as typeof defaultTransactionCategories.$inferSelect);
  }

  async update(params: {
    id: string;
    data: UpdateDefaultCategoryData;
    tx?: DrizzleDb;
  }): Promise<DefaultCategoryInfo | null> {
    const { id, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updates.name = data.name;
    }

    if (data.parentDefaultTransactionCategoryId !== undefined) {
      updates.parentDefaultTransactionCategoryId = data.parentDefaultTransactionCategoryId;
    }

    const result = await db
      .update(defaultTransactionCategories)
      .set(updates)
      .where(
        and(
          eq(defaultTransactionCategories.id, id),
          isNull(defaultTransactionCategories.deletedAt),
        ),
      )
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.toDefaultCategoryInfo(
      result[0] as typeof defaultTransactionCategories.$inferSelect,
    );
  }

  async softDelete(id: string, tx?: DrizzleDb): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .update(defaultTransactionCategories)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(defaultTransactionCategories.id, id),
          isNull(defaultTransactionCategories.deletedAt),
        ),
      )
      .returning();

    return result.length > 0;
  }

  async existsByNameTypeAndParent(
    params: {
      name: string;
      type: TransactionType;
      parentDefaultTransactionCategoryId: string | null;
      excludeId?: string;
    },
    tx?: DrizzleDb,
  ): Promise<boolean> {
    const db = tx ?? this.db;
    const { name, type, parentDefaultTransactionCategoryId, excludeId } = params;
    const conditions: SQL[] = [
      eq(defaultTransactionCategories.name, name),
      eq(defaultTransactionCategories.type, type),
      isNull(defaultTransactionCategories.deletedAt),
    ];

    if (parentDefaultTransactionCategoryId) {
      conditions.push(
        eq(
          defaultTransactionCategories.parentDefaultTransactionCategoryId,
          parentDefaultTransactionCategoryId,
        ),
      );
    } else {
      conditions.push(isNull(defaultTransactionCategories.parentDefaultTransactionCategoryId));
    }

    if (excludeId) {
      conditions.push(ne(defaultTransactionCategories.id, excludeId));
    }

    const result = await db
      .select({ count: count() })
      .from(defaultTransactionCategories)
      .where(and(...conditions));

    return (result[0]?.count ?? 0) > 0;
  }

  async hasActiveChildren(categoryId: string, tx?: DrizzleDb): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db
      .select({ count: count() })
      .from(defaultTransactionCategories)
      .where(
        and(
          eq(defaultTransactionCategories.parentDefaultTransactionCategoryId, categoryId),
          isNull(defaultTransactionCategories.deletedAt),
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
        .select({
          parentDefaultTransactionCategoryId:
            defaultTransactionCategories.parentDefaultTransactionCategoryId,
        })
        .from(defaultTransactionCategories)
        .where(
          and(
            eq(defaultTransactionCategories.id, currentId),
            isNull(defaultTransactionCategories.deletedAt),
          ),
        )
        .limit(1);

      currentId = result[0]?.parentDefaultTransactionCategoryId ?? null;
    }

    return false;
  }

  private toDefaultCategoryInfo(
    row: typeof defaultTransactionCategories.$inferSelect,
  ): DefaultCategoryInfo {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      parentDefaultTransactionCategoryId: row.parentDefaultTransactionCategoryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
