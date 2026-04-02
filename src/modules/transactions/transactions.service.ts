import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type { DrizzleDb } from '@/database/types.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import { TransactionRepository } from './transactions.repository.js';
import type {
  CreateTransactionData,
  TransactionInfo,
  TransactionListQuery,
  TransactionListResult,
  UpdateTransactionData,
} from './transactions.repository.js';
import type { TransactionGroupDto } from './dtos/transactions-by-category-response.dto.js';

const CACHE_MODULE = 'transactions';

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
        const totalsMap = new Map<string, number>();

        for (const tx of txList) {
          const current = totalsMap.get(tx.currencyCode) ?? 0;
          totalsMap.set(tx.currencyCode, current + parseFloat(tx.amount));
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
