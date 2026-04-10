import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { DrizzleDb } from '@/database/types.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { isUniqueViolation } from '@/shared/utils/pg-errors.js';

import { TransactionCategoryRepository } from './transaction-categories.repository.js';
import type {
  CategoryInfo,
  CategoryListQuery,
  CategoryListResult,
  CreateCategoryData,
  UpdateCategoryData,
} from './transaction-categories.repository.js';

const CACHE_MODULE = 'categories';

@Injectable()
export class TransactionCategoriesService {
  constructor(
    private readonly categoryRepository: TransactionCategoryRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: CategoryListQuery): Promise<CategoryListResult> {
    if (query.root && query.parentCategoryId) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot use both root and parentCategoryId filters simultaneously',
      });
    }

    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: query.userId,
      operation: 'list',
      params: query,
    });

    return this.cacheService.wrap(key, () => this.categoryRepository.findAll(query));
  }

  async findById(id: string, userId: string): Promise<CategoryInfo> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId,
      operation: 'detail',
      params: { id },
    });
    const category = await this.cacheService.wrap(key, () =>
      this.categoryRepository.findById(id, userId),
    );

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${id} not found`,
      });
    }

    return category;
  }

  async create(data: CreateCategoryData): Promise<CategoryInfo> {
    const result = await this.categoryRepository.transaction(async (tx) => {
      if (data.parentCategoryId) {
        const parent = await this.categoryRepository.findById(
          data.parentCategoryId,
          data.userId,
          tx,
        );
        if (!parent) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Parent category ${data.parentCategoryId} not found`,
          });
        }
      }

      await this.checkDuplicateCategory(
        {
          userId: data.userId,
          name: data.name,
          type: data.type,
          parentCategoryId: data.parentCategoryId ?? null,
        },
        tx,
      );

      try {
        return await this.categoryRepository.create(data, tx);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'A category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, data.userId));

    return result;
  }

  async update(id: string, userId: string, data: UpdateCategoryData): Promise<CategoryInfo> {
    if (data.name === undefined && data.parentCategoryId === undefined) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'At least one field must be provided for update',
      });
    }

    if (data.parentCategoryId === id) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A category cannot be its own parent',
      });
    }

    const result = await this.categoryRepository.transaction(async (tx) => {
      const existing = await this.categoryRepository.findById(id, userId, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Category ${id} not found`,
        });
      }

      if (data.parentCategoryId) {
        const parent = await this.categoryRepository.findById(data.parentCategoryId, userId, tx);
        if (!parent) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Parent category ${data.parentCategoryId} not found`,
          });
        }

        const wouldCycle = await this.categoryRepository.isDescendantOf(
          data.parentCategoryId,
          id,
          tx,
        );
        if (wouldCycle) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'Cannot set parent to a descendant category (would create a cycle)',
          });
        }
      }

      const resolvedParentId =
        data.parentCategoryId !== undefined ? data.parentCategoryId : existing.parentCategoryId;

      await this.checkDuplicateCategory(
        {
          userId,
          name: data.name ?? existing.name,
          type: existing.type,
          parentCategoryId: resolvedParentId ?? null,
          excludeId: id,
        },
        tx,
      );

      try {
        const updated = await this.categoryRepository.update({ id, userId, data, tx });
        if (!updated) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Category ${id} not found`,
          });
        }

        return updated;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'A category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.categoryRepository.transaction(async (tx) => {
      const category = await this.categoryRepository.findById(id, userId, tx);
      if (!category) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Category ${id} not found`,
        });
      }

      const hasChildren = await this.categoryRepository.hasActiveChildren(id, tx);
      if (hasChildren) {
        throw new ConflictException({
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'Cannot delete category that has active subcategories',
        });
      }

      const hasTransactions = await this.categoryRepository.hasTransactions(id, tx);
      if (hasTransactions) {
        throw new ConflictException({
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'Cannot delete category that has associated transactions',
        });
      }

      await this.categoryRepository.softDelete(id, userId, tx);
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE, userId));
  }

  async validateCategoryForTransaction(params: {
    categoryId: string;
    userId: string;
    transactionType?: TransactionType;
    tx?: DrizzleDb;
  }): Promise<void> {
    const { categoryId, userId, transactionType, tx } = params;
    const category = await this.categoryRepository.findForValidation(categoryId, userId, tx);

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${categoryId} not found`,
      });
    }

    if (transactionType && category.type !== transactionType) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Category type "${category.type}" does not match transaction type "${transactionType}"`,
      });
    }
  }

  private async checkDuplicateCategory(
    params: {
      userId: string;
      name: string;
      type: TransactionType;
      parentCategoryId: string | null;
      excludeId?: string;
    },
    tx?: DrizzleDb,
  ): Promise<void> {
    const exists = await this.categoryRepository.existsByNameTypeAndParent(
      {
        userId: params.userId,
        name: params.name,
        type: params.type,
        parentCategoryId: params.parentCategoryId,
        excludeId: params.excludeId,
      },
      tx,
    );

    if (exists) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A category with this name, type, and parent already exists',
      });
    }
  }
}
