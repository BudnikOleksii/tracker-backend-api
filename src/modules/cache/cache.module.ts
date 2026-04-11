import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { Redis } from 'ioredis';

import { CacheService } from './cache.service.js';
import { REDIS_CLIENT, redisClientProvider } from './redis.provider.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisClientProvider, CacheService],
  exports: [CacheService, REDIS_CLIENT],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
