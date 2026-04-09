import { Module } from '@nestjs/common';

import { TransactionCategoriesController } from './transaction-categories.controller.js';
import { TransactionCategoryRepository } from './transaction-categories.repository.js';
import { TransactionCategoriesService } from './transaction-categories.service.js';

@Module({
  controllers: [TransactionCategoriesController],
  providers: [TransactionCategoriesService, TransactionCategoryRepository],
  exports: [TransactionCategoriesService, TransactionCategoryRepository],
})
export class TransactionCategoriesModule {}
