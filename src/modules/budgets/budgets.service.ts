import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';

import type { DrizzleDb } from '@/database/types.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { TransactionCategoryRepository } from '@/modules/transaction-categories/transaction-categories.repository.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { BudgetPeriod, BudgetStatus } from '@/shared/enums/budget.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { BudgetRepository } from './budgets.repository.js';
import type {
  BudgetInfo,
  BudgetListQuery,
  BudgetListResult,
  UpdateBudgetData,
} from './budgets.repository.js';

const CACHE_MODULE = 'budgets';

export interface CreateBudgetInput {
  userId: string;
  categoryId?: string;
  amount: string;
  currencyCode: CurrencyCode;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  description?: string;
}

export interface BudgetProgress {
  budget: BudgetInfo;
  spentAmount: string;
  remainingAmount: string;
  percentUsed: number;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: TransactionCategoryRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: BudgetListQuery): Promise<BudgetListResult> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: query.userId,
      operation: 'list',
      params: query,
    });

    return this.cacheService.wrap(key, () => this.budgetRepository.findAll(query));
  }

  async findById(id: string, userId: string): Promise<BudgetInfo> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'detail',
      params: { id },
    });
    const budget = await this.cacheService.wrap(key, () =>
      this.budgetRepository.findById(id, userId),
    );

    if (!budget) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Budget ${id} not found`,
      });
    }

    return budget;
  }

  async create(data: CreateBudgetInput): Promise<BudgetInfo> {
    if (data.period === 'CUSTOM' && !data.endDate) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'endDate is required for CUSTOM period',
      });
    }

    const endDate = data.endDate ?? this.computeEndDate(data.startDate, data.period);
    this.assertValidDateRange(data.startDate, endDate);

    const result = await this.budgetRepository.transaction(async (tx) => {
      if (data.categoryId) {
        await this.validateCategory(data.categoryId, data.userId, tx);
      }

      await this.checkOverlap({
        userId: data.userId,
        categoryId: data.categoryId ?? null,
        currencyCode: data.currencyCode,
        startDate: data.startDate,
        endDate,
        tx,
      });

      return this.budgetRepository.create({ ...data, endDate }, tx);
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, data.userId));

    return result;
  }

  async update(id: string, userId: string, data: UpdateBudgetData): Promise<BudgetInfo> {
    const hasUpdates = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdates) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'At least one field must be provided for update',
      });
    }

    const result = await this.budgetRepository.transaction(async (tx) => {
      const existing = await this.budgetRepository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Budget ${id} not found`,
        });
      }

      if (data.categoryId !== undefined) {
        if (data.categoryId !== null) {
          await this.validateCategory(data.categoryId, userId, tx);
        }
      }

      if (data.categoryId !== undefined || data.endDate !== undefined) {
        const categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
        const endDate = data.endDate ?? existing.endDate;
        this.assertValidDateRange(existing.startDate, endDate);

        await this.checkOverlap({
          userId,
          categoryId: categoryId ?? null,
          currencyCode: existing.currencyCode,
          startDate: existing.startDate,
          endDate,
          excludeId: id,
          tx,
        });
      }

      const updated = await this.budgetRepository.update({ id, userId, data, tx });
      if (!updated) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Budget ${id} not found`,
        });
      }

      return updated;
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    const wasDeleted = await this.budgetRepository.delete(id, userId);
    if (!wasDeleted) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Budget ${id} not found`,
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
  }

  async getProgress(id: string, userId: string): Promise<BudgetProgress> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'progress',
      params: { id },
    });

    return this.cacheService.wrap(key, async () => {
      const budget = await this.budgetRepository.findById(id, userId);
      if (!budget) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Budget ${id} not found`,
        });
      }

      const spentAmount = await this.budgetRepository.getSpentAmount({
        userId,
        categoryId: budget.categoryId,
        currencyCode: budget.currencyCode,
        startDate: budget.startDate,
        endDate: budget.endDate,
      });

      const spent = new Decimal(spentAmount);
      const budgetAmount = new Decimal(budget.amount);
      const remaining = budgetAmount.minus(spent);
      const percentUsed = budgetAmount.gt(0)
        ? spent.div(budgetAmount).times(100).toDecimalPlaces(2).toNumber()
        : 0;

      return {
        budget,
        spentAmount: spent.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        percentUsed,
      };
    });
  }

  async checkOverspendForAllBudgets(): Promise<{ checked: number; updated: number }> {
    const now = new Date();
    const [activeBudgets, spentAmounts] = await Promise.all([
      this.budgetRepository.findActiveBudgetsWithFutureEndDate(now),
      this.budgetRepository.getSpentAmountForAllActiveBudgets(now),
    ]);

    const spentByBudgetId = new Map(spentAmounts.map(({ budgetId, spent }) => [budgetId, spent]));

    const statusUpdates: { id: string; status: BudgetStatus }[] = [];

    for (const budget of activeBudgets) {
      const spent = new Decimal(spentByBudgetId.get(budget.id) ?? '0');
      const amount = new Decimal(budget.amount);

      if (spent.gt(amount) && budget.status === 'ACTIVE') {
        statusUpdates.push({ id: budget.id, status: 'EXCEEDED' });
      } else if (spent.lte(amount) && budget.status === 'EXCEEDED') {
        statusUpdates.push({ id: budget.id, status: 'ACTIVE' });
      }
    }

    if (statusUpdates.length > 0) {
      await this.budgetRepository.bulkUpdateStatuses(statusUpdates);

      const updatedIds = new Set(statusUpdates.map((u) => u.id));
      const affectedUserIds = new Set(
        activeBudgets.filter((b) => updatedIds.has(b.id)).map((b) => b.userId),
      );

      for (const uid of affectedUserIds) {
        await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, uid));
      }
    }

    return { checked: activeBudgets.length, updated: statusUpdates.length };
  }

  private assertValidDateRange(startDate: Date, endDate: Date): void {
    if (endDate < startDate) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'endDate must be on or after startDate',
      });
    }
  }

  private computeEndDate(startDate: Date, period: BudgetPeriod): Date {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    switch (period) {
      case 'WEEKLY':
        return new Date(year, month, startDate.getDate() + 6);
      case 'MONTHLY':
        return new Date(year, month + 2, 0);
      case 'QUARTERLY':
        return new Date(year, month + 4, 0);
      case 'YEARLY':
        // day=0 yields the last day of the previous month, so (year+1, month+1, 0) gives the last day of month `month` in `year+1`
        return new Date(year + 1, month + 1, 0);
      default:
        return new Date(startDate);
    }
  }

  private async validateCategory(
    categoryId: string,
    userId: string,
    tx?: DrizzleDb,
  ): Promise<void> {
    const category = await this.categoryRepository.findForValidation(categoryId, userId, tx);

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${categoryId} not found`,
      });
    }
  }

  private async checkOverlap(params: {
    userId: string;
    categoryId: string | null;
    currencyCode: CurrencyCode;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
    tx?: DrizzleDb;
  }): Promise<void> {
    const overlap = await this.budgetRepository.findOverlapping({
      userId: params.userId,
      categoryId: params.categoryId,
      currencyCode: params.currencyCode,
      startDate: params.startDate,
      endDate: params.endDate,
      excludeId: params.excludeId,
      tx: params.tx,
    });

    if (overlap) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A budget already exists for this category and overlapping period',
      });
    }
  }
}
