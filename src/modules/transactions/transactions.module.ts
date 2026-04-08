import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';
import { TransactionCategoriesModule } from '@/modules/transaction-categories/transaction-categories.module.js';

import { TransactionImportService } from './transaction-import.service.js';
import { TransactionsCacheListener } from './transactions-cache.listener.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [CacheModule, TransactionCategoriesModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionImportService,
    TransactionRepository,
    TransactionsCacheListener,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {}
