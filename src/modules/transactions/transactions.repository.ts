import { Inject, Injectable } from '@nestjs/common';
import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNull,
  lte,
  or,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { transactionCategories, transactions } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { CategoryDetail, CategoryJoinColumns } from '@/shared/types/category-detail.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

import type { SortByField, SortOrder } from './transactions.constants.js';

export type { CategoryDetail };

export interface TransactionInfo {
  id: string;
  categoryId: string;
  category: CategoryDetail;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  date: Date;
  description: string | null;
  recurringTransactionId: string | null;
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
  sortBy?: SortByField;
  sortOrder?: SortOrder;
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

export interface ExportTransactionQuery {
  userId: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CategoryValidationInfo {
  id: string;
  type: TransactionType;
}

export interface ParentCategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
  parentCategoryId: string | null;
  subcategories: { id: string; name: string }[];
}

export const MAX_EXPORT_ROWS = 10_000;

const category = aliasedTable(transactionCategories, 'category');
const parentCategory = aliasedTable(transactionCategories, 'parentCategory');

const JOINED_COLUMNS = {
  ...getTableColumns(transactions),
  categoryName: category.name,
  parentCatId: parentCategory.id,
  parentCatName: parentCategory.name,
} as const;

const SORT_COLUMN_MAP = {
  date: transactions.date,
  amount: transactions.amount,
  createdAt: transactions.createdAt,
} as const;

@Injectable()
export class TransactionRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: TransactionListQuery): Promise<TransactionListResult> {
    const {
      userId,
      page,
      pageSize,
      type,
      categoryId,
      currencyCode,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const conditions: SQL[] = [eq(transactions.userId, userId)];

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
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [data, totalResult] = await Promise.all([
      this.db
        .select(JOINED_COLUMNS)
        .from(transactions)
        .leftJoin(category, eq(transactions.categoryId, category.id))
        .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(sortDirection(sortColumn)),
      this.db.select({ count: count() }).from(transactions).where(whereClause),
    ]);

    return {
      data: data.map((row) => this.toTransactionInfo(row)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findAllForExport(
    query: ExportTransactionQuery,
  ): Promise<{ data: TransactionInfo[]; isTruncated: boolean }> {
    const { userId, categoryId, dateFrom, dateTo } = query;

    const conditions: SQL[] = [eq(transactions.userId, userId)];

    if (categoryId) {
      const subcategories = await this.db
        .select({ id: transactionCategories.id })
        .from(transactionCategories)
        .where(
          and(
            eq(transactionCategories.parentCategoryId, categoryId),
            eq(transactionCategories.userId, userId),
            isNull(transactionCategories.deletedAt),
          ),
        );

      const allCategoryIds = [categoryId, ...subcategories.map((s) => s.id)];
      conditions.push(inArray(transactions.categoryId, allCategoryIds));
    }

    if (dateFrom) {
      conditions.push(gte(transactions.date, new Date(dateFrom)));
    }

    if (dateTo) {
      conditions.push(lte(transactions.date, new Date(dateTo)));
    }

    const data = await this.db
      .select(JOINED_COLUMNS)
      .from(transactions)
      .leftJoin(category, eq(transactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(MAX_EXPORT_ROWS);

    return {
      data: data.map((row) => this.toTransactionInfo(row)),
      isTruncated: data.length === MAX_EXPORT_ROWS,
    };
  }

  async transaction<T>(callback: (tx: DrizzleDb) => Promise<T>): Promise<T> {
    return this.db.transaction(callback);
  }

  async findById(id: string, userId: string, tx?: DrizzleDb): Promise<TransactionInfo | null> {
    const db = tx ?? this.db;
    const result = await db
      .select(JOINED_COLUMNS)
      .from(transactions)
      .leftJoin(category, eq(transactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toTransactionInfo(row);
  }

  async create(data: CreateTransactionData, tx?: DrizzleDb): Promise<TransactionInfo> {
    const db = tx ?? this.db;
    const [inserted] = await db
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
      .returning({ id: transactions.id });

    const result = await this.findById((inserted as { id: string }).id, data.userId, tx);
    if (!result) {
      throw new Error('Failed to retrieve newly created transaction');
    }

    return result;
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateTransactionData;
    tx?: DrizzleDb;
  }): Promise<TransactionInfo | null> {
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

    if (data.date !== undefined) {
      updates.date = data.date;
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    const updated = await db
      .update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    const [row] = updated;
    if (!row) {
      return null;
    }

    return this.findById(row.id, userId, tx);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return result.length > 0;
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

  async findCategoryWithSubcategories(
    categoryId: string,
    userId: string,
  ): Promise<ParentCategoryInfo | null> {
    const rows = await this.db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
        parentCategoryId: transactionCategories.parentCategoryId,
      })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.userId, userId),
          isNull(transactionCategories.deletedAt),
          or(
            eq(transactionCategories.id, categoryId),
            eq(transactionCategories.parentCategoryId, categoryId),
          ),
        ),
      );

    const parent = rows.find((r) => r.id === categoryId);
    if (!parent) {
      return null;
    }

    const subcategories = rows
      .filter((r) => r.parentCategoryId === categoryId)
      .map((r) => ({ id: r.id, name: r.name }));

    return {
      id: parent.id,
      name: parent.name,
      type: parent.type,
      parentCategoryId: parent.parentCategoryId,
      subcategories,
    };
  }

  async findByParentCategory(
    categoryId: string,
    subcategoryIds: string[],
    userId: string,
  ): Promise<TransactionInfo[]> {
    const allCategoryIds = [categoryId, ...subcategoryIds];

    const data = await this.db
      .select(JOINED_COLUMNS)
      .from(transactions)
      .leftJoin(category, eq(transactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
      .where(and(eq(transactions.userId, userId), inArray(transactions.categoryId, allCategoryIds)))
      .orderBy(desc(transactions.date));

    return data.map((row) => this.toTransactionInfo(row));
  }

  async findCategoriesByUser(
    userId: string,
    tx?: DrizzleDb,
  ): Promise<
    { id: string; name: string; type: TransactionType; parentCategoryId: string | null }[]
  > {
    const db = tx ?? this.db;

    return db
      .select({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
        parentCategoryId: transactionCategories.parentCategoryId,
      })
      .from(transactionCategories)
      .where(
        and(eq(transactionCategories.userId, userId), isNull(transactionCategories.deletedAt)),
      );
  }

  async createCategories(
    data: { userId: string; name: string; type: TransactionType; parentCategoryId?: string }[],
    tx: DrizzleDb,
  ): Promise<
    { id: string; name: string; type: TransactionType; parentCategoryId: string | null }[]
  > {
    if (data.length === 0) {
      return [];
    }

    const result = await tx
      .insert(transactionCategories)
      .values(
        data.map((d) => ({
          userId: d.userId,
          name: d.name,
          type: d.type,
          parentCategoryId: d.parentCategoryId,
        })),
      )
      .returning({
        id: transactionCategories.id,
        name: transactionCategories.name,
        type: transactionCategories.type,
        parentCategoryId: transactionCategories.parentCategoryId,
      });

    return result;
  }

  async createTransactions(data: CreateTransactionData[], tx: DrizzleDb): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    const result = await tx
      .insert(transactions)
      .values(
        data.map((d) => ({
          userId: d.userId,
          categoryId: d.categoryId,
          type: d.type,
          amount: d.amount,
          currencyCode: d.currencyCode,
          date: d.date,
          description: d.description,
        })),
      )
      .returning({ id: transactions.id });

    return result.length;
  }

  private toTransactionInfo(
    row: typeof transactions.$inferSelect & CategoryJoinColumns,
  ): TransactionInfo {
    return {
      id: row.id,
      categoryId: row.categoryId,
      category: {
        id: row.categoryId,
        name: row.categoryName ?? 'Unknown',
        parentCategory:
          row.parentCatId && row.parentCatName
            ? { id: row.parentCatId, name: row.parentCatName }
            : null,
      },
      type: row.type,
      amount: row.amount,
      currencyCode: row.currencyCode,
      date: row.date,
      description: row.description,
      recurringTransactionId: row.recurringTransactionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
