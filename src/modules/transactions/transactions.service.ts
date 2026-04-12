import { Readable } from 'node:stream';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { stringify as stringifyCsvStream } from 'csv-stringify';
import { Decimal } from 'decimal.js';

import type { BulkDeleteResult } from '@/shared/dtos/bulk-delete-response.dto.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { TransactionCategoriesService } from '@/modules/transaction-categories/transaction-categories.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import {
  TRANSACTION_EVENTS,
  TransactionMutationEvent,
} from './events/transaction-mutation.event.js';
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
import { CACHE_MODULE } from './transactions.constants.js';

@Injectable()
export class TransactionsService {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoriesService: TransactionCategoriesService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
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
      await this.categoriesService.validateCategoryForTransaction({
        categoryId: data.categoryId,
        userId: data.userId,
        transactionType: data.type,
        tx,
      });

      return this.transactionRepository.create(data, tx);
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, data.userId));
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.CREATED,
      new TransactionMutationEvent(data.userId, 'created'),
    );

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
        await this.categoriesService.validateCategoryForTransaction({
          categoryId,
          userId,
          transactionType: type,
          tx,
        });
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
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.UPDATED,
      new TransactionMutationEvent(userId, 'updated'),
    );

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
    this.eventEmitter.emit(
      TRANSACTION_EVENTS.DELETED,
      new TransactionMutationEvent(userId, 'deleted'),
    );
  }

  async bulkDelete(ids: string[], userId: string): Promise<BulkDeleteResult> {
    const deletedIds = await this.transactionRepository.bulkDelete(ids, userId);
    const deletedSet = new Set(deletedIds);
    const failed = ids
      .filter((id) => !deletedSet.has(id))
      .map((id) => ({ id, reason: 'Not found' }));

    if (deletedIds.length > 0) {
      await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
      this.eventEmitter.emit(
        TRANSACTION_EVENTS.DELETED,
        new TransactionMutationEvent(userId, 'deleted'),
      );
    }

    const total = ids.length;
    const message =
      failed.length === 0
        ? `${deletedIds.length} transactions deleted successfully`
        : `${deletedIds.length} of ${total} transactions deleted`;

    return { deleted: deletedIds.length, failed, message };
  }

  async getTransactionsByCategory(
    categoryId: string,
    userId: string,
  ): Promise<{ groups: TransactionGroupDto[]; isTruncated: boolean }> {
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
      const { data: allTransactions, isTruncated } =
        await this.transactionRepository.findByParentCategory(categoryId, subcategoryIds, userId);

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

      return { groups, isTruncated };
    });
  }

  async exportTransactions(params: {
    userId: string;
    format: ExportFormat;
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
  }): Promise<{ stream: Readable; contentType: string; filename: string; isTruncated: boolean }> {
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

    const stream = Readable.from(
      (function* () {
        yield '[';
        for (let i = 0; i < exportRows.length; i++) {
          if (i > 0) {
            yield ',';
          }
          yield JSON.stringify(exportRows[i]);
        }
        yield ']';
      })(),
    );

    return { stream, contentType: 'application/json', filename, isTruncated };
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
}
