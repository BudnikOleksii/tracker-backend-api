import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import type { DrizzleDb } from '@/database/types.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import { CACHE_MODULE } from './recurring-transactions.constants.js';
import type { RecurringFrequency } from './recurring-transactions.constants.js';
import { RecurringTransactionsRepository } from './recurring-transactions.repository.js';
import type {
  CreateRecurringTransactionData,
  RecurringTransactionInfo,
  RecurringTransactionListQuery,
  RecurringTransactionListResult,
  UpdateRecurringTransactionData,
} from './recurring-transactions.repository.js';

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  constructor(
    private readonly repository: RecurringTransactionsRepository,
    private readonly cacheService: CacheService,
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
      await this.validateCategory({
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
        await this.validateCategory({ categoryId, userId, transactionType: type, tx });
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
        const frequency = (data.frequency ?? existing.frequency) as RecurringFrequency;
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
      } catch {
        // Individual failures don't affect other records
      }
    }

    if (processedCount > 0) {
      await this.invalidateCache(userId);
    }

    if (totalTransactionsCreated > 0) {
      await this.cacheService.delByPrefix(buildCachePrefix('transactions', userId));
      await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
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

    for (const record of dueRecords) {
      try {
        const created = await this.processOneRecurringTransaction(record, record.userId, today);
        totalTransactionsCreated += created;
        processedCount++;
        affectedUserIds.add(record.userId);
      } catch (error) {
        this.logger.error(
          `Failed to process recurring transaction ${record.id} for user ${record.userId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    for (const userId of affectedUserIds) {
      await this.cacheService.delByPrefix(buildCachePrefix('transactions', userId));
      await this.cacheService.delByPrefix(buildCachePrefix('transactions-analytics', userId));
      await this.invalidateCache(userId);
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
      const frequency = record.frequency as RecurringFrequency;
      const interval = record.interval;
      let transactionsCreated = 0;

      while (nextDate <= today) {
        if (record.endDate && nextDate > record.endDate) {
          break;
        }

        await this.repository.createTransaction(
          {
            userId,
            categoryId: record.categoryId,
            type: record.type as 'EXPENSE' | 'INCOME',
            amount: record.amount,
            currencyCode: record.currencyCode as Parameters<
              typeof this.repository.createTransaction
            >[0]['currencyCode'],
            date: nextDate,
            description: record.description ?? undefined,
            recurringTransactionId: record.id,
          },
          tx,
        );
        transactionsCreated++;

        nextDate = this.advanceDate(nextDate, frequency, interval);
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

      return transactionsCreated;
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

  private async validateCategory(params: {
    categoryId: string;
    userId: string;
    transactionType: string;
    tx?: DrizzleDb;
  }): Promise<void> {
    const { categoryId, userId, transactionType, tx } = params;
    const category = await this.repository.findCategoryByIdAndUserId(categoryId, userId, tx);

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

  private async invalidateCache(userId: string): Promise<void> {
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
  }
}
