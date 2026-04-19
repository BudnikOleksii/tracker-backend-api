import path from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { parse } from 'csv-parse';

import type { DrizzleDb } from '@/database/types.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { CURRENCY_CODES } from '@/shared/enums/currency-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import { buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import {
  TRANSACTION_EVENTS,
  TransactionMutationEvent,
} from './events/transaction-mutation.event.js';
import { TransactionRepository } from './transactions.repository.js';
import type { CreateTransactionData } from './transactions.repository.js';
import type { ImportResult, ParsedTransactionRow } from './transactions.types.js';
import { CACHE_MODULE } from './transactions.constants.js';

const MAX_IMPORT_ROWS = 3000;
const TYPE_MAP: Record<string, TransactionType> = {
  expense: 'EXPENSE',
  income: 'INCOME',
};
const REQUIRED_CSV_HEADERS = ['Date', 'Category', 'Type', 'Amount', 'Currency'] as const;
const CURRENCY_SET = new Set<string>(CURRENCY_CODES);

@Injectable()
export class TransactionImportService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

      return {
        transactionsCreated,
        categoriesCreated,
        subcategoriesCreated,
        failedCount: 0,
        errors: [],
      };
    });

    await Promise.all([
      this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId)),
      this.cacheService.delByPrefix(buildCachePrefix('categories', userId)),
    ]);
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.IMPORTED,
      new TransactionMutationEvent(userId, 'imported'),
    );

    return result;
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
}
