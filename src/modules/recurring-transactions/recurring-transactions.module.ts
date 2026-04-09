import { Module } from '@nestjs/common';

import { TransactionCategoriesModule } from '@/modules/transaction-categories/transaction-categories.module.js';

import { RecurringTransactionsController } from './recurring-transactions.controller.js';
import { RecurringTransactionsRepository } from './recurring-transactions.repository.js';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

@Module({
  imports: [TransactionCategoriesModule],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringTransactionsRepository],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
