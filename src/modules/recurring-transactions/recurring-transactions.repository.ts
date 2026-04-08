import { Inject, Injectable } from '@nestjs/common';
import { aliasedTable, and, asc, count, desc, eq, getTableColumns, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import {
  recurringTransactions,
  transactionCategories,
  transactions,
} from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { RecurringFrequency } from '@/shared/enums/recurring-frequency.enum.js';
import type { RecurringTransactionStatus } from '@/shared/enums/recurring-transaction-status.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import type { CategoryDetail, CategoryJoinColumns } from '@/shared/types/category-detail.js';

import type { SortByField } from './recurring-transactions.constants.js';

export interface RecurringTransactionInfo {
  id: string;
  userId: string;
  categoryId: string;
  category: CategoryDetail;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  description: string | null;
  frequency: RecurringFrequency;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  nextOccurrenceDate: Date;
  status: RecurringTransactionStatus;
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
  sortBy?: SortByField;
  sortOrder?: SortOrder;
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

const category = aliasedTable(transactionCategories, 'category');
const parentCategory = aliasedTable(transactionCategories, 'parentCategory');

const JOINED_COLUMNS = {
  ...getTableColumns(recurringTransactions),
  categoryName: category.name,
  parentCatId: parentCategory.id,
  parentCatName: parentCategory.name,
} as const;

const SORT_COLUMN_MAP = {
  amount: recurringTransactions.amount,
  startDate: recurringTransactions.startDate,
  nextOccurrenceDate: recurringTransactions.nextOccurrenceDate,
  createdAt: recurringTransactions.createdAt,
} as const;

@Injectable()
export class RecurringTransactionsRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: RecurringTransactionListQuery): Promise<RecurringTransactionListResult> {
    const {
      userId,
      page,
      pageSize,
      status,
      type,
      categoryId,
      currencyCode,
      frequency,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

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
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [data, totalResult] = await Promise.all([
      this.db
        .select(JOINED_COLUMNS)
        .from(recurringTransactions)
        .leftJoin(category, eq(recurringTransactions.categoryId, category.id))
        .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(sortDirection(sortColumn)),
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
      .select(JOINED_COLUMNS)
      .from(recurringTransactions)
      .leftJoin(category, eq(recurringTransactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .limit(1);

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toRecurringTransactionInfo(row);
  }

  async create(
    data: CreateRecurringTransactionData,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo> {
    const db = tx ?? this.db;
    const [inserted] = await db
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
      .returning({ id: recurringTransactions.id });

    const created = await this.findById((inserted as { id: string }).id, data.userId, tx);
    if (!created) {
      throw new Error('Failed to retrieve newly created recurring transaction');
    }

    return created;
  }

  async update(params: {
    id: string;
    userId: string;
    data: UpdateRecurringTransactionData;
    tx?: DrizzleDb;
  }): Promise<RecurringTransactionInfo | null> {
    const { id, userId, data, tx } = params;
    const db = tx ?? this.db;
    const updates: Partial<typeof recurringTransactions.$inferInsert> = {};

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

    const updated = await db
      .update(recurringTransactions)
      .set(updates)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .returning({ id: recurringTransactions.id });

    const [updatedRow] = updated;
    if (!updatedRow) {
      return null;
    }

    return this.findById(updatedRow.id, userId, tx);
  }

  async findDueRecurringTransactions(
    userId: string,
    today: Date,
    tx?: DrizzleDb,
  ): Promise<RecurringTransactionInfo[]> {
    const db = tx ?? this.db;
    const result = await db
      .select(JOINED_COLUMNS)
      .from(recurringTransactions)
      .leftJoin(category, eq(recurringTransactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
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
      .select(JOINED_COLUMNS)
      .from(recurringTransactions)
      .leftJoin(category, eq(recurringTransactions.categoryId, category.id))
      .leftJoin(parentCategory, eq(category.parentCategoryId, parentCategory.id))
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

  private toRecurringTransactionInfo(
    row: typeof recurringTransactions.$inferSelect & CategoryJoinColumns,
  ): RecurringTransactionInfo {
    return {
      id: row.id,
      userId: row.userId,
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
