import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';

import { createClsConfig } from './app/config/cls.config.js';
import { validateEnv } from './app/config/env.schema.js';
import { AllExceptionsFilter } from './app/filters/all-exceptions.filter.js';
import { ProblemDetailsFilter } from './app/filters/problem-details.filter.js';
import { HealthModule } from './app/health/health.module.js';
import { RequestContextInterceptor } from './app/interceptors/request-context.interceptor.js';
import { LoggerModule } from './app/logger/logger.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditLogInterceptor } from './modules/audit-log/audit-log.interceptor.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CacheModule } from './modules/cache/cache.module.js';
import { ScheduledTasksModule } from './modules/scheduled-tasks/scheduled-tasks.module.js';
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
    LoggerModule,
    DatabaseModule.forRoot(),
    HealthModule,
    AuditLogModule,
    CacheModule,
    AuthModule,
    UserModule,
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
  ],
})
export class AppModule {}
