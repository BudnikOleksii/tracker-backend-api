import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';
import { RecurringTransactionsModule } from '../recurring-transactions/recurring-transactions.module.js';
import { ScheduledTasksService } from './scheduled-tasks.service.js';

@Module({
  imports: [AuthModule, RecurringTransactionsModule, BudgetsModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
