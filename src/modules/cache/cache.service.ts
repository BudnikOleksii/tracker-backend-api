import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';

import type { Env } from '@/app/config/env.schema.js';

import { REDIS_CLIENT } from './redis.provider.js';

const SCAN_BATCH_SIZE = 100;

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    configService: ConfigService<Env, true>,
  ) {
    this.defaultTtl = configService.get('REDIS_TTL', { infer: true });
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.redis.get(key);
    if (raw === null) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Corrupt cache entry for key="${key}", deleting`);
      await this.redis.del(key);

      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlSeconds = ttl ?? this.defaultTtl;
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
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
        const pipeline = this.redis.pipeline();
        for (const key of keys) {
          pipeline.unlink(key);
        }
        await pipeline.exec();
      }
    } while (cursor !== '0');
  }

  async reset(): Promise<void> {
    await this.redis.flushdb();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const existing = this.inFlight.get(key);
    if (existing) {
      // Safe: same cache key always produces the same T
      return existing as Promise<T>;
    }

    const promise = fn()
      .then(async (result) => {
        await this.set(key, result, ttl);

        return result;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);

    return promise;
  }
}
