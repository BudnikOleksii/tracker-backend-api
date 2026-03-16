import { Module } from '@nestjs/common';

import { CacheModule } from '@/modules/cache/cache.module.js';

import { TransactionsAnalyticsController } from './transactions-analytics.controller.js';
import { TransactionsAnalyticsRepository } from './transactions-analytics.repository.js';
import { TransactionsAnalyticsService } from './transactions-analytics.service.js';

@Module({
  imports: [CacheModule],
  controllers: [TransactionsAnalyticsController],
  providers: [TransactionsAnalyticsService, TransactionsAnalyticsRepository],
})
export class TransactionsAnalyticsModule {}
