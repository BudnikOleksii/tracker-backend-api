import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';

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
    if (data.parentCategoryId) {
      const parent = await this.categoryRepository.findById(data.parentCategoryId, data.userId);
      if (!parent) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Parent category ${data.parentCategoryId} not found`,
        });
      }
    }

    await this.checkDuplicateCategory({
      userId: data.userId,
      name: data.name,
      type: data.type,
      parentCategoryId: data.parentCategoryId ?? null,
    });

    try {
      return await this.categoryRepository.create(data);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'A category with this name, type, and parent already exists',
        });
      }
      throw error;
    }
  }

  async update(id: string, userId: string, data: UpdateCategoryData): Promise<CategoryInfo> {
    if (data.parentCategoryId === id) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'A category cannot be its own parent',
      });
    }

    if (data.parentCategoryId) {
      const parent = await this.categoryRepository.findById(data.parentCategoryId, userId);
      if (!parent) {
        throw new NotFoundException({
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: `Parent category ${data.parentCategoryId} not found`,
        });
      }
    }

    try {
      const updated = await this.categoryRepository.update(id, userId, data);
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
  }

  async delete(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, userId);
    if (!category) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Category ${id} not found`,
      });
    }

    const hasTransactions = await this.categoryRepository.hasTransactions(id);
    if (hasTransactions) {
      throw new ConflictException({
        code: ErrorCode.RESOURCE_CONFLICT,
        message: 'Cannot delete category that has associated transactions',
      });
    }

    await this.categoryRepository.softDelete(id, userId);
  }

  private async checkDuplicateCategory(params: {
    userId: string;
    name: string;
    type: string;
    parentCategoryId: string | null;
  }): Promise<void> {
    const exists = await this.categoryRepository.existsByNameTypeAndParent({
      userId: params.userId,
      name: params.name,
      type: params.type as 'EXPENSE' | 'INCOME',
      parentCategoryId: params.parentCategoryId,
    });

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
