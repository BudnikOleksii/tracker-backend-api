import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';

import { TransactionRepository } from './transactions.repository.js';
import type {
  CreateTransactionData,
  TransactionInfo,
  TransactionListQuery,
  TransactionListResult,
  UpdateTransactionData,
} from './transactions.repository.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async findAll(query: TransactionListQuery): Promise<TransactionListResult> {
    return this.transactionRepository.findAll(query);
  }

  async findById(id: string, userId: string): Promise<TransactionInfo> {
    const transaction = await this.transactionRepository.findById(id, userId);
    if (!transaction) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    return transaction;
  }

  async create(data: CreateTransactionData): Promise<TransactionInfo> {
    await this.validateCategory(data.categoryId, data.userId, data.type);

    return this.transactionRepository.create(data);
  }

  async update(id: string, userId: string, data: UpdateTransactionData): Promise<TransactionInfo> {
    const existing = await this.transactionRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    if (data.categoryId !== undefined || data.type !== undefined) {
      const categoryId = data.categoryId ?? existing.categoryId;
      const type = data.type ?? existing.type;
      await this.validateCategory(categoryId, userId, type);
    }

    const updated = await this.transactionRepository.update(id, userId, data);
    if (!updated) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(id, userId);
    if (!transaction) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: `Transaction ${id} not found`,
      });
    }

    await this.transactionRepository.softDelete(id, userId);
  }

  private async validateCategory(
    categoryId: string,
    userId: string,
    transactionType: string,
  ): Promise<void> {
    const category = await this.transactionRepository.findCategoryByIdAndUserId(categoryId, userId);

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
