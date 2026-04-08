import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { DrizzleDb } from '@/database/types.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';
import { isUniqueViolation } from '@/shared/utils/pg-errors.js';

import { DefaultTransactionCategoryRepository } from './default-transaction-categories.repository.js';
import type {
  CreateDefaultCategoryData,
  DefaultCategoryInfo,
  DefaultCategoryListQuery,
  DefaultCategoryListResult,
  UpdateDefaultCategoryData,
} from './default-transaction-categories.repository.js';

@Injectable()
export class DefaultTransactionCategoriesService {
  constructor(private readonly repository: DefaultTransactionCategoryRepository) {}

  async findAll(query: DefaultCategoryListQuery): Promise<DefaultCategoryListResult> {
    if (query.root && query.type === undefined) {
      // root filter is fine on its own
    }

    return this.repository.findAll(query);
  }

  async findById(id: string): Promise<DefaultCategoryInfo> {
    const category = await this.repository.findById(id);

    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Default transaction category ${id} not found`,
      });
    }

    return category;
  }

  async create(data: CreateDefaultCategoryData): Promise<DefaultCategoryInfo> {
    const result = await this.repository.transaction(async (tx) => {
      if (data.parentDefaultTransactionCategoryId) {
        const parent = await this.repository.findById(data.parentDefaultTransactionCategoryId, tx);
        if (!parent) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Parent default transaction category ${data.parentDefaultTransactionCategoryId} not found`,
          });
        }
      }

      await this.checkDuplicate(
        {
          name: data.name,
          type: data.type,
          parentDefaultTransactionCategoryId: data.parentDefaultTransactionCategoryId ?? null,
        },
        tx,
      );

      try {
        return await this.repository.create(data, tx);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message:
              'A default transaction category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });

    return result;
  }

  async update(id: string, data: UpdateDefaultCategoryData): Promise<DefaultCategoryInfo> {
    if (data.name === undefined && data.parentDefaultTransactionCategoryId === undefined) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'At least one field must be provided for update',
      });
    }

    if (data.parentDefaultTransactionCategoryId === id) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A default transaction category cannot be its own parent',
      });
    }

    const result = await this.repository.transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Default transaction category ${id} not found`,
        });
      }

      if (data.parentDefaultTransactionCategoryId) {
        const parent = await this.repository.findById(data.parentDefaultTransactionCategoryId, tx);
        if (!parent) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Parent default transaction category ${data.parentDefaultTransactionCategoryId} not found`,
          });
        }

        const wouldCycle = await this.repository.isDescendantOf(
          data.parentDefaultTransactionCategoryId,
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
        data.parentDefaultTransactionCategoryId !== undefined
          ? data.parentDefaultTransactionCategoryId
          : existing.parentDefaultTransactionCategoryId;

      await this.checkDuplicate(
        {
          name: data.name ?? existing.name,
          type: existing.type,
          parentDefaultTransactionCategoryId: resolvedParentId ?? null,
          excludeId: id,
        },
        tx,
      );

      try {
        const updated = await this.repository.update({ id, data, tx });
        if (!updated) {
          throw new NotFoundException({
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: `Default transaction category ${id} not found`,
          });
        }

        return updated;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException({
            code: ErrorCode.RESOURCE_CONFLICT,
            message:
              'A default transaction category with this name, type, and parent already exists',
          });
        }
        throw error;
      }
    });

    return result;
  }

  async delete(id: string): Promise<void> {
    await this.repository.transaction(async (tx) => {
      const category = await this.repository.findById(id, tx);
      if (!category) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Default transaction category ${id} not found`,
        });
      }

      const hasChildren = await this.repository.hasActiveChildren(id, tx);
      if (hasChildren) {
        throw new ConflictException({
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'Cannot delete default transaction category that has active subcategories',
        });
      }

      await this.repository.softDelete(id, tx);
    });
  }

  async assignDefaultCategoriesToUser(userId: string): Promise<void> {
    await this.repository.cloneDefaultCategoriesToUser(userId);
  }

  private async checkDuplicate(
    params: {
      name: string;
      type: TransactionType;
      parentDefaultTransactionCategoryId: string | null;
      excludeId?: string;
    },
    tx?: DrizzleDb,
  ): Promise<void> {
    const exists = await this.repository.existsByNameTypeAndParent(
      {
        name: params.name,
        type: params.type,
        parentDefaultTransactionCategoryId: params.parentDefaultTransactionCategoryId,
        excludeId: params.excludeId,
      },
      tx,
    );

    if (exists) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A default transaction category with this name, type, and parent already exists',
      });
    }
  }
}
