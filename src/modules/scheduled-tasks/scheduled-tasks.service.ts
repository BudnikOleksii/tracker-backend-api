import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';

import { TokenService } from '../auth/token.service.js';
import { BudgetsService } from '../budgets/budgets.service.js';
import { RecurringTransactionsService } from '../recurring-transactions/recurring-transactions.service.js';

const HEARTBEAT_INTERVAL = 30_000;
const ON_START_TIMEOUT = 5000;

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly recurringTransactionsService: RecurringTransactionsService,
    private readonly budgetsService: BudgetsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredSessions(): Promise<void> {
    const deleted = await this.tokenService.deleteExpiredTokens();
    this.logger.log(`Cleaned ${deleted} expired session(s)`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringTransactions(): Promise<void> {
    this.logger.log('Processing recurring transactions...');
    const result = await this.recurringTransactionsService.processAllRecurringTransactions();
    this.logger.log(
      `Processed ${result.processedCount} recurring transaction(s), created ${result.transactionsCreated} transaction(s)`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkBudgetOverspend(): Promise<void> {
    this.logger.log('Checking budget overspend...');
    const result = await this.budgetsService.checkOverspendForAllBudgets();
    this.logger.log(`Checked ${result.checked} budget(s), updated ${result.updated} status(es)`);
  }

  @Interval(HEARTBEAT_INTERVAL)
  heartbeat(): void {
    this.logger.debug('Heartbeat: application is alive');
  }

  @Timeout(ON_START_TIMEOUT)
  onStartup(): void {
    this.logger.log('Startup task executed 5 seconds after boot');
  }
}
