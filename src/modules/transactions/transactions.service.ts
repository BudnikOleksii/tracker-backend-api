import path from 'node:path';
import type { Readable } from 'node:stream';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { parse } from 'csv-parse';
import { stringify as stringifyCsvStream } from 'csv-stringify';
import { Decimal } from 'decimal.js';

import type { DrizzleDb } from '@/database/types.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import type { ExportFormat } from './dtos/export-transaction-query.dto.js';
import { TransactionRepository } from './transactions.repository.js';
import type {
  CreateTransactionData,
  ExportTransactionQuery,
  TransactionInfo,
  TransactionListQuery,
  TransactionListResult,
  UpdateTransactionData,
} from './transactions.repository.js';
import type { TransactionGroupDto } from './dtos/transactions-by-category-response.dto.js';
import type { ImportResult, ParsedTransactionRow } from './transactions.types.js';

const CACHE_MODULE = 'transactions';
const MAX_IMPORT_ROWS = 1000;
const TYPE_MAP: Record<string, TransactionType> = {
  expense: 'EXPENSE',
  income: 'INCOME',
};
const REQUIRED_CSV_HEADERS = ['Date', 'Category', 'Type', 'Amount', 'Currency'] as const;
const CURRENCY_SET = new Set<string>(CURRENCY_CODES);

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: TransactionListQuery): Promise<TransactionListResult> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: query.userId,
      operation: 'list',
      params: query,
    });

    return this.cacheService.wrap(key, () => this.transactionRepository.findAll(query));
  }

  async findById(id: string, userId: string): Promise<TransactionInfo> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'detail',
      params: { id },
    });
    const transaction = await this.cacheService.wrap(key, () =>
      this.transactionRepository.findById(id, userId),
    );

    if (!transaction) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    return transaction;
  }

  async create(data: CreateTransactionData): Promise<TransactionInfo> {
    const result = await this.transactionRepository.transaction(async (tx) => {
      await this.validateCategory({
        categoryId: data.categoryId,
        userId: data.userId,
        transactionType: data.type,
        tx,
      });

      return this.transactionRepository.create(data, tx);
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, data.userId));
    await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', data.userId));
    await this.cacheService.delByPrefix(buildCachePrefix('budgets', data.userId));

    return result;
  }

  async update(id: string, userId: string, data: UpdateTransactionData): Promise<TransactionInfo> {
    const hasUpdates = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdates) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'At least one field must be provided for update',
      });
    }

    const result = await this.transactionRepository.transaction(async (tx) => {
      const existing = await this.transactionRepository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Transaction ${id} not found`,
        });
      }

      if (data.categoryId !== undefined || data.type !== undefined) {
        const categoryId = data.categoryId ?? existing.categoryId;
        const type = data.type ?? existing.type;
        await this.validateCategory({ categoryId, userId, transactionType: type, tx });
      }

      const updated = await this.transactionRepository.update({ id, userId, data, tx });
      if (!updated) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Transaction ${id} not found`,
        });
      }

      return updated;
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
    await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
    await this.cacheService.delByPrefix(buildCachePrefix('budgets', userId));

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.transactionRepository.delete(id, userId);
    if (!wasDeleted) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
    await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
    await this.cacheService.delByPrefix(buildCachePrefix('budgets', userId));
  }

  async getTransactionsByCategory(
    categoryId: string,
    userId: string,
  ): Promise<{ groups: TransactionGroupDto[] }> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'by-category',
      params: { categoryId },
    });

    return this.cacheService.wrap(key, async () => {
      const category = await this.transactionRepository.findCategoryWithSubcategories(
        categoryId,
        userId,
      );

      if (!category) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Category ${categoryId} not found`,
        });
      }

      if (category.parentCategoryId !== null) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message:
            'This endpoint requires a parent category. The provided category is a subcategory.',
        });
      }

      const subcategoryIds = category.subcategories.map((s) => s.id);
      const allTransactions = await this.transactionRepository.findByParentCategory(
        categoryId,
        subcategoryIds,
        userId,
      );

      const subcategoryMap = new Map(category.subcategories.map((s) => [s.id, s]));
      const grouped = new Map<string | null, TransactionInfo[]>();

      for (const tx of allTransactions) {
        const groupKey = tx.categoryId === categoryId ? null : tx.categoryId;
        const existing = grouped.get(groupKey);
        if (existing) {
          existing.push(tx);
        } else {
          grouped.set(groupKey, [tx]);
        }
      }

      const groups: TransactionGroupDto[] = [];

      for (const [groupKey, txList] of grouped) {
        const subcategory = groupKey ? (subcategoryMap.get(groupKey) ?? null) : null;
        const totalsMap = new Map<string, Decimal>();

        for (const tx of txList) {
          const current = totalsMap.get(tx.currencyCode) ?? new Decimal(0);
          totalsMap.set(tx.currencyCode, current.plus(tx.amount));
        }

        const totals = Array.from(totalsMap.entries()).map(([currencyCode, total]) => ({
          currencyCode: currencyCode as TransactionInfo['currencyCode'],
          total: total.toFixed(2),
        }));

        groups.push({
          subcategory: subcategory ? { id: subcategory.id, name: subcategory.name } : null,
          transactions: txList,
          totals,
        });
      }

      return { groups };
    });
  }

  async importTransactions(file: Express.Multer.File, userId: string): Promise<ImportResult> {
    const rows = await this.parseImportFile(file);

    const result = await this.transactionRepository.transaction(async (tx) => {
      const { categoryMap, categoriesCreated, subcategoriesCreated } = await this.resolveCategories(
        rows,
        userId,
        tx,
      );

      const transactionData: CreateTransactionData[] = rows.map((row) => {
        const key = row.subcategory
          ? `${row.category}|${row.type}|${row.subcategory}`
          : `${row.category}|${row.type}`;
        const categoryId = categoryMap.get(key);
        if (!categoryId) {
          throw new BadRequestException({
            code: ErrorCode.BAD_REQUEST,
            message: `Failed to resolve category "${row.category}" with type "${row.type}"`,
          });
        }

        return {
          userId,
          categoryId,
          type: row.type,
          amount: row.amount,
          currencyCode: row.currencyCode,
          date: row.date,
        };
      });

      const transactionsCreated = await this.transactionRepository.createTransactions(
        transactionData,
        tx,
      );

      return { transactionsCreated, categoriesCreated, subcategoriesCreated };
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
    await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
    await this.cacheService.delByPrefix(buildCachePrefix('budgets', userId));
    await this.cacheService.delByPrefix(buildCachePrefix('categories', userId));

    return result;
  }

  async exportTransactions(params: {
    userId: string;
    format: ExportFormat;
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
  }): Promise<
    | { stream: Readable; contentType: string; filename: string; isTruncated: boolean }
    | { content: string; contentType: string; filename: string; isTruncated: boolean }
  > {
    const { userId, format, dateFrom, dateTo, categoryId } = params;

    const query: ExportTransactionQuery = { userId, dateFrom, dateTo, categoryId };
    const [exportResult, categories] = await Promise.all([
      this.transactionRepository.findAllForExport(query),
      this.transactionRepository.findCategoriesByUser(userId),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const exportRows = exportResult.data.map((row) => this.toExportRow(row, categoryMap));
    const { isTruncated } = exportResult;

    const date = new Date().toISOString().split('T')[0];
    const filename = `transactions-${date}.${format}`;

    if (format === 'csv') {
      const stream = stringifyCsvStream(exportRows, {
        header: true,
        columns: ['Date', 'Category', 'Type', 'Amount', 'Currency', 'Subcategory'],
      });

      return { stream, contentType: 'text/csv', filename, isTruncated };
    }

    const content = JSON.stringify(exportRows, null, 2);

    return { content, contentType: 'application/json', filename, isTruncated };
  }

  private toExportRow(
    row: TransactionInfo,
    categoryMap: Map<
      string,
      { id: string; name: string; type: TransactionType; parentCategoryId: string | null }
    >,
  ): Record<string, string | number | undefined> {
    const category = categoryMap.get(row.categoryId);
    let categoryName = category?.name ?? 'Unknown';
    let subcategoryName: string | undefined;

    if (category?.parentCategoryId) {
      const parent = categoryMap.get(category.parentCategoryId);
      subcategoryName = category.name;
      categoryName = parent?.name ?? 'Unknown';
    }

    const date = row.date;
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const formattedDate = `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;

    const typeLabel = row.type === 'EXPENSE' ? 'Expense' : 'Income';

    return {
      Date: formattedDate,
      Category: categoryName,
      Type: typeLabel,
      Amount: parseFloat(row.amount),
      Currency: row.currencyCode,
      ...(subcategoryName ? { Subcategory: subcategoryName } : {}),
    };
  }

  private async parseImportFile(file: Express.Multer.File): Promise<ParsedTransactionRow[]> {
    const extension = path.extname(file.originalname).slice(1).toLowerCase();

    let rows: ParsedTransactionRow[];
    if (extension === 'json') {
      rows = this.parseJsonFile(file.buffer);
    } else if (extension === 'csv') {
      rows = await this.parseCsvFile(file.buffer);
    } else {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Unsupported file format. Only .json and .csv files are accepted',
      });
    }

    if (rows.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'File contains no transaction data',
      });
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `File contains ${rows.length} rows, maximum allowed is ${MAX_IMPORT_ROWS}`,
      });
    }

    return rows;
  }

  private parseJsonFile(buffer: Buffer): ParsedTransactionRow[] {
    let data: unknown;
    try {
      data = JSON.parse(buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Invalid JSON file',
      });
    }

    if (!Array.isArray(data)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'JSON file must contain an array of transactions',
      });
    }

    return data.map((entry: Record<string, unknown>, index: number) =>
      this.validateRow(entry, index),
    );
  }

  private async parseCsvFile(buffer: Buffer): Promise<ParsedTransactionRow[]> {
    const records: Record<string, string>[] = [];

    try {
      const parser = parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      for await (const record of parser) {
        records.push(record as Record<string, string>);
      }
    } catch {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Invalid CSV file',
      });
    }

    if (records.length === 0) {
      return [];
    }

    const firstRecord = records[0];
    if (!firstRecord) {
      return [];
    }
    const headers = Object.keys(firstRecord);
    const missingHeaders = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Missing required CSV headers: ${missingHeaders.join(', ')}`,
      });
    }

    return records.map((record, index) =>
      this.validateRow(
        {
          Date: record['Date'],
          Category: record['Category'],
          Type: record['Type'],
          Amount: record['Amount'] ? Number(record['Amount']) : undefined,
          Currency: record['Currency'],
          Subcategory: record['Subcategory'] || undefined,
        },
        index,
      ),
    );
  }

  private validateRow(entry: Record<string, unknown>, index: number): ParsedTransactionRow {
    const rowLabel = `Row ${index + 1}`;

    const dateStr = entry['Date'];
    if (typeof dateStr !== 'string' || !dateStr) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Date" is required and must be a string`,
      });
    }

    const date = this.parseDate(dateStr);
    if (!date) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: Invalid date format "${dateStr}". Expected MM/DD/YYYY HH:mm:ss`,
      });
    }

    const category = entry['Category'];
    if (typeof category !== 'string' || !category.trim()) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Category" is required and must be a non-empty string`,
      });
    }

    const typeRaw = entry['Type'];
    if (typeof typeRaw !== 'string' || !typeRaw) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Type" is required and must be "Expense" or "Income"`,
      });
    }
    const type = TYPE_MAP[typeRaw.toLowerCase()];
    if (!type) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: Invalid type "${typeRaw}". Must be "Expense" or "Income"`,
      });
    }

    const amountRaw = entry['Amount'];
    if (amountRaw === undefined || amountRaw === null || amountRaw === '') {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Amount" is required`,
      });
    }
    const amount = Number(amountRaw);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Amount" must be a positive number`,
      });
    }

    const currency = entry['Currency'];
    if (typeof currency !== 'string' || !currency) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: "Currency" is required`,
      });
    }
    if (!CURRENCY_SET.has(currency)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `${rowLabel}: Unrecognized currency code "${currency}"`,
      });
    }

    const subcategory = entry['Subcategory'];
    const subcategoryStr =
      typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim() : undefined;

    return {
      date,
      category: category.trim(),
      type,
      amount: amount.toFixed(2),
      currencyCode: currency as CurrencyCode,
      subcategory: subcategoryStr,
    };
  }

  private parseDate(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) {
      return null;
    }

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    const seconds = Number(match[6]);

    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

    if (
      isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      date.getUTCHours() !== hours ||
      date.getUTCMinutes() !== minutes ||
      date.getUTCSeconds() !== seconds
    ) {
      return null;
    }

    return date;
  }

  private async resolveCategories(
    rows: ParsedTransactionRow[],
    userId: string,
    tx: DrizzleDb,
  ): Promise<{
    categoryMap: Map<string, string>;
    categoriesCreated: number;
    subcategoriesCreated: number;
  }> {
    const existingCategories = await this.transactionRepository.findCategoriesByUser(userId, tx);

    const categoryById = new Map<string, { id: string; name: string; type: TransactionType }>();
    const existingParentMap = new Map<string, string>();
    const existingSubMap = new Map<string, string>();

    for (const cat of existingCategories) {
      categoryById.set(cat.id, { id: cat.id, name: cat.name, type: cat.type });
    }

    for (const cat of existingCategories) {
      if (cat.parentCategoryId === null) {
        existingParentMap.set(`${cat.name}|${cat.type}`, cat.id);
      } else {
        const parent = categoryById.get(cat.parentCategoryId);
        if (parent) {
          existingSubMap.set(`${parent.name}|${cat.type}|${cat.name}`, cat.id);
        }
      }
    }

    const neededParents = new Set<string>();
    const neededSubs = new Set<string>();

    for (const row of rows) {
      const parentKey = `${row.category}|${row.type}`;
      if (!existingParentMap.has(parentKey)) {
        neededParents.add(parentKey);
      }
      if (row.subcategory) {
        const subKey = `${row.category}|${row.type}|${row.subcategory}`;
        if (!existingSubMap.has(subKey)) {
          neededSubs.add(subKey);
        }
      }
    }

    let categoriesCreated = 0;
    if (neededParents.size > 0) {
      const parentData = [...neededParents].map((key) => {
        const [name, type] = key.split('|') as [string, TransactionType];

        return { userId, name, type };
      });

      const created = await this.transactionRepository.createCategories(parentData, tx);
      categoriesCreated = created.length;

      for (const cat of created) {
        existingParentMap.set(`${cat.name}|${cat.type}`, cat.id);
        categoryById.set(cat.id, { id: cat.id, name: cat.name, type: cat.type });
      }
    }

    let subcategoriesCreated = 0;
    if (neededSubs.size > 0) {
      const subData = [...neededSubs].map((key) => {
        const [parentName, type, subName] = key.split('|') as [string, TransactionType, string];
        const parentId = existingParentMap.get(`${parentName}|${type}`);
        if (!parentId) {
          throw new BadRequestException({
            code: ErrorCode.BAD_REQUEST,
            message: `Failed to resolve parent category "${parentName}" for subcategory "${subName}"`,
          });
        }

        return { userId, name: subName, type, parentCategoryId: parentId };
      });

      const created = await this.transactionRepository.createCategories(subData, tx);
      subcategoriesCreated = created.length;

      for (const cat of created) {
        const parent = cat.parentCategoryId ? categoryById.get(cat.parentCategoryId) : undefined;
        if (parent) {
          existingSubMap.set(`${parent.name}|${cat.type}|${cat.name}`, cat.id);
        }
      }
    }

    const categoryMap = new Map<string, string>();
    for (const row of rows) {
      if (row.subcategory) {
        const subKey = `${row.category}|${row.type}|${row.subcategory}`;
        const id = existingSubMap.get(subKey);
        if (id) {
          categoryMap.set(subKey, id);
        }
      } else {
        const parentKey = `${row.category}|${row.type}`;
        const id = existingParentMap.get(parentKey);
        if (id) {
          categoryMap.set(parentKey, id);
        }
      }
    }

    return { categoryMap, categoriesCreated, subcategoriesCreated };
  }

  private async validateCategory(params: {
    categoryId: string;
    userId: string;
    transactionType: TransactionType;
    tx?: DrizzleDb;
  }): Promise<void> {
    const { categoryId, userId, transactionType, tx } = params;
    const category = await this.transactionRepository.findCategoryByIdAndUserId(
      categoryId,
      userId,
      tx,
    );

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${categoryId} not found`,
      });
    }

    if (category.type !== transactionType) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Category type "${category.type}" does not match transaction type "${transactionType}"`,
      });
    }
  }
}
