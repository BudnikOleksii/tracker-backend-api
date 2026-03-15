import KeyvRedis from '@keyv/redis';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { Env } from '@/app/config/env.schema.js';

import { CACHE_PORT } from './cache.port.js';
import { CacheService } from './cache.service.js';

@Module({
  imports: [
    ConfigModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Env, true>) => {
        const url = configService.get('REDIS_URL', { infer: true });
        const ttl = configService.get('REDIS_TTL', { infer: true });

        return {
          stores: [new KeyvRedis(url)],
          ttl: ttl * 1000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    CacheService,
    {
      provide: CACHE_PORT,
      useExisting: CacheService,
    },
  ],
  exports: [CacheService, CACHE_PORT],
})
export class CacheModule {}
