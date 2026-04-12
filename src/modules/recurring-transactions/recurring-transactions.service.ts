import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { BulkDeleteResult } from '@/shared/dtos/bulk-delete-response.dto.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { TransactionCategoriesService } from '@/modules/transaction-categories/transaction-categories.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { RecurringFrequency } from '@/shared/enums/recurring-frequency.enum.js';
import {
  TRANSACTION_EVENTS,
  TransactionMutationEvent,
} from '@/modules/transactions/events/transaction-mutation.event.js';

import { CACHE_MODULE } from './recurring-transactions.constants.js';
import { RecurringTransactionsRepository } from './recurring-transactions.repository.js';
import type {
  CreateMaterializedTransactionData,
  CreateRecurringTransactionData,
  RecurringTransactionInfo,
  RecurringTransactionListQuery,
  RecurringTransactionListResult,
  UpdateRecurringTransactionData,
} from './recurring-transactions.repository.js';

const INSERT_CHUNK_SIZE = 1000;

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly repository: RecurringTransactionsRepository,
    private readonly categoriesService: TransactionCategoriesService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: RecurringTransactionListQuery): Promise<RecurringTransactionListResult> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: query.userId,
      operation: 'list',
      params: query,
    });

    return this.cacheService.wrap(key, () => this.repository.findAll(query));
  }

  async findById(id: string, userId: string): Promise<RecurringTransactionInfo> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'detail',
      params: { id },
    });
    const record = await this.cacheService.wrap(key, () => this.repository.findById(id, userId));

    if (!record) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Recurring transaction ${id} not found`,
      });
    }

    return record;
  }

  async create(
    data: Omit<CreateRecurringTransactionData, 'nextOccurrenceDate'>,
  ): Promise<RecurringTransactionInfo> {
    if (data.endDate && data.endDate < data.startDate) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'End date must be on or after start date',
      });
    }

    const result = await this.repository.transaction(async (tx) => {
      await this.categoriesService.validateCategoryForTransaction({
        categoryId: data.categoryId,
        userId: data.userId,
        transactionType: data.type,
        tx,
      });

      return this.repository.create(
        {
          ...data,
          nextOccurrenceDate: data.startDate,
        },
        tx,
      );
    });

    await this.invalidateCache(data.userId);

    return result;
  }

  async update(
    id: string,
    userId: string,
    data: Omit<UpdateRecurringTransactionData, 'status' | 'nextOccurrenceDate'>,
  ): Promise<RecurringTransactionInfo> {
    const hasUpdates = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdates) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'At least one field must be provided for update',
      });
    }

    const result = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      if (existing.status === 'CANCELLED') {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Cannot update a cancelled recurring transaction',
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

      const effectiveStartDate = data.startDate ?? existing.startDate;
      const effectiveEndDate = data.endDate ?? existing.endDate;

      if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'End date must be on or after start date',
        });
      }

      const updateData: UpdateRecurringTransactionData = { ...data };

      if (
        data.frequency !== undefined ||
        data.interval !== undefined ||
        data.startDate !== undefined
      ) {
        const frequency = data.frequency ?? existing.frequency;
        const interval = data.interval ?? existing.interval;
        updateData.nextOccurrenceDate = this.calculateNextOccurrenceFromStart(
          effectiveStartDate,
          frequency,
          interval,
        );
      }

      const updated = await this.repository.update({ id, userId, data: updateData, tx });
      if (!updated) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      return updated;
    });

    await this.invalidateCache(userId);

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      return this.repository.update({
        id,
        userId,
        data: { status: 'CANCELLED' },
        tx,
      });
    });

    if (!result) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Recurring transaction ${id} not found`,
      });
    }

    await this.invalidateCache(userId);
  }

  async bulkDelete(ids: string[], userId: string): Promise<BulkDeleteResult> {
    const { cancelledIds, failed } = await this.repository.bulkCancel(ids, userId);

    if (cancelledIds.length > 0) {
      await this.invalidateCache(userId);
    }

    const total = ids.length;
    const message =
      failed.length === 0
        ? `${cancelledIds.length} recurring transactions deleted successfully`
        : `${cancelledIds.length} of ${total} recurring transactions deleted`;

    return { deleted: cancelledIds.length, failed, message };
  }

  async pause(id: string, userId: string): Promise<RecurringTransactionInfo> {
    const result = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      if (existing.status !== 'ACTIVE') {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Only active recurring transactions can be paused',
        });
      }

      const updated = await this.repository.update({
        id,
        userId,
        data: { status: 'PAUSED' },
        tx,
      });

      if (!updated) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      return updated;
    });

    await this.invalidateCache(userId);

    return result;
  }

  async resume(id: string, userId: string): Promise<RecurringTransactionInfo> {
    const result = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      if (existing.status !== 'PAUSED') {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Only paused recurring transactions can be resumed',
        });
      }

      const updated = await this.repository.update({
        id,
        userId,
        data: { status: 'ACTIVE' },
        tx,
      });

      if (!updated) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Recurring transaction ${id} not found`,
        });
      }

      return updated;
    });

    await this.invalidateCache(userId);

    return result;
  }

  async processRecurringTransactions(
    userId: string,
  ): Promise<{ processedCount: number; transactionsCreated: number }> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueRecords = await this.repository.findDueRecurringTransactions(userId, today);

    let totalTransactionsCreated = 0;
    let processedCount = 0;

    for (const record of dueRecords) {
      try {
        const created = await this.processOneRecurringTransaction(record, userId, today);
        totalTransactionsCreated += created;
        processedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to process recurring transaction ${record.id} for user ${userId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    if (processedCount > 0) {
      await this.invalidateCache(userId);
    }

    if (totalTransactionsCreated > 0) {
      this.eventEmitter.emit(
        TRANSACTION_EVENTS.BULK_PROCESSED,
        new TransactionMutationEvent(userId, 'bulk-processed'),
      );
    }

    return { processedCount, transactionsCreated: totalTransactionsCreated };
  }

  async processAllRecurringTransactions(): Promise<{
    processedCount: number;
    transactionsCreated: number;
  }> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueRecords = await this.repository.findAllDueRecurringTransactions(today);

    let totalTransactionsCreated = 0;
    let processedCount = 0;
    const affectedUserIds = new Set<string>();
    const usersWithCreatedTransactions = new Set<string>();

    const BATCH_SIZE = 5;

    for (let i = 0; i < dueRecords.length; i += BATCH_SIZE) {
      const chunk = dueRecords.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        chunk.map((record) => this.processOneRecurringTransaction(record, record.userId, today)),
      );

      chunk.forEach((record, j) => {
        const result = results[j] as PromiseSettledResult<number>;
        if (result.status === 'fulfilled') {
          totalTransactionsCreated += result.value;
          processedCount++;
          affectedUserIds.add(record.userId);
          if (result.value > 0) {
            usersWithCreatedTransactions.add(record.userId);
          }
        } else {
          this.logger.error(
            `Failed to process recurring transaction ${record.id} for user ${record.userId}`,
            result.reason instanceof Error ? result.reason.stack : undefined,
          );
        }
      });
    }

    await Promise.all([...affectedUserIds].map((userId) => this.invalidateCache(userId)));

    for (const userId of usersWithCreatedTransactions) {
      this.eventEmitter.emit(
        TRANSACTION_EVENTS.BULK_PROCESSED,
        new TransactionMutationEvent(userId, 'bulk-processed'),
      );
    }

    return { processedCount, transactionsCreated: totalTransactionsCreated };
  }

  private async processOneRecurringTransaction(
    record: RecurringTransactionInfo,
    userId: string,
    today: Date,
  ): Promise<number> {
    return this.repository.transaction(async (tx) => {
      let nextDate = new Date(record.nextOccurrenceDate);
      const frequency = record.frequency;
      const interval = record.interval;
      const batch: CreateMaterializedTransactionData[] = [];

      while (nextDate <= today) {
        if (record.endDate && nextDate > record.endDate) {
          break;
        }

        batch.push({
          userId,
          categoryId: record.categoryId,
          type: record.type,
          amount: record.amount,
          currencyCode: record.currencyCode,
          date: new Date(nextDate),
          description: record.description ?? undefined,
          recurringTransactionId: record.id,
        });

        nextDate = this.advanceDate(nextDate, frequency, interval);
      }

      for (let i = 0; i < batch.length; i += INSERT_CHUNK_SIZE) {
        await this.repository.createTransactionsBatch(batch.slice(i, i + INSERT_CHUNK_SIZE), tx);
      }

      const shouldCancel = record.endDate && nextDate > record.endDate;

      await this.repository.update({
        id: record.id,
        userId,
        data: {
          nextOccurrenceDate: nextDate,
          ...(shouldCancel ? { status: 'CANCELLED' as const } : {}),
        },
        tx,
      });

      return batch.length;
    });
  }

  private advanceDate(date: Date, frequency: RecurringFrequency, interval: number): Date {
    const result = new Date(date);

    switch (frequency) {
      case 'DAILY':
        result.setDate(result.getDate() + interval);
        break;
      case 'WEEKLY':
        result.setDate(result.getDate() + interval * 7);
        break;
      case 'MONTHLY': {
        const originalDay = result.getDate();
        result.setMonth(result.getMonth() + interval);
        // Handle month-end: if day overflowed (e.g. Jan 31 -> Mar 3), set to last day of target month
        if (result.getDate() !== originalDay) {
          result.setDate(0); // Sets to last day of previous month
        }
        break;
      }
      case 'YEARLY': {
        const originalMonth = result.getMonth();
        const originalDayOfMonth = result.getDate();
        result.setFullYear(result.getFullYear() + interval);
        // Handle leap year: Feb 29 -> Feb 28 in non-leap year
        if (result.getMonth() !== originalMonth || result.getDate() !== originalDayOfMonth) {
          result.setDate(0);
        }
        break;
      }
    }

    return result;
  }

  private calculateNextOccurrenceFromStart(
    startDate: Date,
    frequency: RecurringFrequency,
    interval: number,
  ): Date {
    const todayCutoff = new Date();
    todayCutoff.setHours(0, 0, 0, 0);

    let next = new Date(startDate);

    if (next >= todayCutoff) {
      return startDate;
    }

    // Advance until next is on or after today (same cutoff as processors use)
    while (next < todayCutoff) {
      next = this.advanceDate(next, frequency, interval);
    }

    return next;
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
  }
}
