import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { TransactionCategoriesController } from './transaction-categories.controller.js';
import { TransactionCategoryRepository } from './transaction-categories.repository.js';
import { TransactionCategoriesService } from './transaction-categories.service.js';

@Module({
  imports: [CacheModule],
  controllers: [TransactionCategoriesController],
  providers: [TransactionCategoriesService, TransactionCategoryRepository],
  exports: [TransactionCategoriesService],
})
export class TransactionCategoriesModule {}
