import KeyvRedis from '@keyv/redis';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';

import type { Env } from '@/app/config/env.schema.js';

import { CACHE_PORT } from './cache.port.js';
import { CacheService } from './cache.service.js';
import { REDIS_CLIENT, redisClientProvider } from './redis.provider.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => {
        const url = configService.get('REDIS_URL', { infer: true });
        const ttl = configService.get('REDIS_TTL', { infer: true });

        return {
          stores: [new KeyvRedis(url)],
          ttl: ttl * 1000,
        };
      },
    }),
  ],
  providers: [
    redisClientProvider,
    CacheService,
    {
      provide: CACHE_PORT,
      useExisting: CacheService,
    },
  ],
  exports: [CacheService, CACHE_PORT, REDIS_CLIENT],
})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
