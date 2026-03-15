import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { DrizzleDb } from '@/database/types.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import type { TransactionType } from './transaction-categories.constants.js';
import { TransactionCategoryRepository } from './transaction-categories.repository.js';
import type {
  CategoryInfo,
  CategoryListQuery,
  CategoryListResult,
  CreateCategoryData,
  UpdateCategoryData,
} from './transaction-categories.repository.js';

@Injectable()
export class TransactionCategoriesService {
  constructor(private readonly categoryRepository: TransactionCategoryRepository) {}

  async findAll(query: CategoryListQuery): Promise<CategoryListResult> {
    if (query.root && query.parentCategoryId) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot use both root and parentCategoryId filters simultaneously',
      });
    }

    return this.categoryRepository.findAll(query);
  }

  async findById(id: string, userId: string): Promise<CategoryInfo> {
    const category = await this.categoryRepository.findById(id, userId);
    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${id} not found`,
      });
    }

    return category;
  }

  async create(data: CreateCategoryData): Promise<CategoryInfo> {
    return this.categoryRepository.transaction(async (tx) => {
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
        if (this.isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'A category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });
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

    return this.categoryRepository.transaction(async (tx) => {
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
          type: existing.type as TransactionType,
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
        if (this.isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message: 'A category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    return this.categoryRepository.transaction(async (tx) => {
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

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    );
  }
}
