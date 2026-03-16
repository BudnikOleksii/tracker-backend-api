import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';

import type { Env } from './app/config/env.schema.js';
import { createClsConfig } from './app/config/cls.config.js';
import { validateEnv } from './app/config/env.schema.js';
import { AllExceptionsFilter } from './app/filters/all-exceptions.filter.js';
import { ProblemDetailsFilter } from './app/filters/problem-details.filter.js';
import { HealthModule } from './app/health/health.module.js';
import { RequestContextInterceptor } from './app/interceptors/request-context.interceptor.js';
import { AppThrottlerGuard } from './app/throttler/app-throttler.guard.js';
import { RedisThrottlerStorage } from './app/throttler/redis-throttler.storage.js';
import { LoggerModule } from './app/logger/logger.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditLogInterceptor } from './modules/audit-log/audit-log.interceptor.js';
import { TransactionsAnalyticsModule } from './modules/transactions-analytics/transactions-analytics.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CacheModule } from './modules/cache/cache.module.js';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module.js';
import { TransactionCategoriesModule } from './modules/transaction-categories/transaction-categories.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
    ClsModule.forRoot(createClsConfig()),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get('THROTTLE_TTL', { infer: true }),
            limit: config.get('THROTTLE_LIMIT', { infer: true }),
          },
          {
            name: 'auth',
            ttl: config.get('THROTTLE_AUTH_TTL', { infer: true }),
            limit: config.get('THROTTLE_AUTH_LIMIT', { infer: true }),
          },
        ],
        storage: new RedisThrottlerStorage(config),
      }),
    }),
    LoggerModule,
    DatabaseModule.forRoot(),
    HealthModule,
    TransactionsAnalyticsModule,
    AuditLogModule,
    CacheModule,
    AuthModule,
    UserModule,
    TransactionCategoriesModule,
    TransactionsModule,
    ScheduledTasksModule,
  ],
  providers: [
    AllExceptionsFilter,
    ProblemDetailsFilter,
    RequestContextInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
