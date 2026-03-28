import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Cache } from 'cache-manager';

import type { Env } from '@/app/config/env.schema.js';

import type { CachePort } from './cache.port.js';

const SCAN_BATCH_SIZE = 100;

@Injectable()
export class CacheService implements CachePort, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    configService: ConfigService<Env, true>,
  ) {
    this.redis = new Redis(configService.get('REDIS_URL', { infer: true }));
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlMs = ttl ? ttl * 1000 : undefined;
    await this.cacheManager.set(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const pattern = `${prefix}*`;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        SCAN_BATCH_SIZE,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const result = await fn();
    await this.set(key, result, ttl);

    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
