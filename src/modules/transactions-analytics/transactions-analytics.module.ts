import { Module } from '@nestjs/common';

import { TransactionsAnalyticsCacheListener } from './transactions-analytics-cache.listener.js';
import { TransactionsAnalyticsController } from './transactions-analytics.controller.js';
import { TransactionsAnalyticsRepository } from './transactions-analytics.repository.js';
import { TransactionsAnalyticsService } from './transactions-analytics.service.js';

@Module({
  controllers: [TransactionsAnalyticsController],
  providers: [
    TransactionsAnalyticsService,
    TransactionsAnalyticsRepository,
    TransactionsAnalyticsCacheListener,
  ],
})
export class TransactionsAnalyticsModule {}
