import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { RecurringTransactionsController } from './recurring-transactions.controller.js';
import { RecurringTransactionsRepository } from './recurring-transactions.repository.js';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

@Module({
  imports: [CacheModule],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringTransactionsRepository],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
