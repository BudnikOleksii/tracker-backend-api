import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { TransactionsCacheListener } from './transactions-cache.listener.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [CacheModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository, TransactionsCacheListener],
  exports: [TransactionsService],
})
export class TransactionsModule {}
