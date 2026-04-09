import { Module } from '@nestjs/common';

import { DefaultTransactionCategoriesController } from './default-transaction-categories.controller.js';
import { DefaultTransactionCategoryRepository } from './default-transaction-categories.repository.js';
import { DefaultTransactionCategoriesService } from './default-transaction-categories.service.js';

@Module({
  controllers: [DefaultTransactionCategoriesController],
  providers: [DefaultTransactionCategoriesService, DefaultTransactionCategoryRepository],
  exports: [DefaultTransactionCategoriesService, DefaultTransactionCategoryRepository],
})
export class DefaultTransactionCategoriesModule {}
