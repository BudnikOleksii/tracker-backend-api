import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RecurringTransactionsModule } from '../recurring-transactions/recurring-transactions.module.js';
import { ScheduledTasksService } from './scheduled-tasks.service.js';

@Module({
  imports: [AuthModule, RecurringTransactionsModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
