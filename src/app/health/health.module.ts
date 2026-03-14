import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { DrizzleHealthIndicator } from './drizzle.health.js'
import { HealthController } from './health.controller.js'
import { RedisHealthIndicator } from './redis.health.js'
import { CacheModule } from '@/modules/cache/cache.module.js'

@Module({
  imports: [
    TerminusModule,
    CacheModule,
  ],
  controllers: [HealthController],
  providers: [
    DrizzleHealthIndicator,
    RedisHealthIndicator,
  ],
})
export class HealthModule {}
