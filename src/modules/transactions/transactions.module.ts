import { Module } from '@nestjs/common';

import { TransactionsController } from './transactions.controller.js';
import { TransactionRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository],
  exports: [TransactionsService],
})
export class TransactionsModule {}
