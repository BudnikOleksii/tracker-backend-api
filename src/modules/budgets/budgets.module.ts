import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { BudgetsController } from './budgets.controller.js';
import { BudgetRepository } from './budgets.repository.js';
import { BudgetsService } from './budgets.service.js';

@Module({
  imports: [CacheModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
