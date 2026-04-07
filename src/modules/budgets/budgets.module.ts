import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { BudgetsCacheListener } from './budgets-cache.listener.js';
import { BudgetsController } from './budgets.controller.js';
import { BudgetRepository } from './budgets.repository.js';
import { BudgetsService } from './budgets.service.js';

@Module({
  imports: [CacheModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetRepository, BudgetsCacheListener],
  exports: [BudgetsService],
})
export class BudgetsModule {}
