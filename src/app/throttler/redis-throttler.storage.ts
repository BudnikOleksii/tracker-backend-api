import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { ThrottlerStorage } from '@nestjs/throttler';

import type { Env } from '../config/env.schema.js';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

interface IncrementParams {
  key: string;
  ttl: number;
  limit: number;
  blockDuration: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly redis: Redis;

  constructor(configService: ConfigService<Env, true>) {
    this.redis = new Redis(configService.get('REDIS_URL', { infer: true }));
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- required by ThrottlerStorage interface
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.performIncrement({ key, ttl, limit, blockDuration });
    } catch (error) {
      this.logger.error('Redis throttler storage unavailable, failing open', error);

      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
    }
  }

  private async performIncrement(params: IncrementParams): Promise<ThrottlerStorageRecord> {
    const { key, ttl, limit, blockDuration } = params;
    const ttlSeconds = Math.ceil(ttl / 1000);
    const blockKey = `${key}:blocked`;

    const isBlocked = await this.redis.exists(blockKey);
    if (isBlocked) {
      const timeToBlockExpire = await this.redis.ttl(blockKey);
      const totalHits = Number.parseInt((await this.redis.get(key)) ?? '0', 10);

      return {
        totalHits,
        timeToExpire: ttlSeconds,
        isBlocked: true,
        timeToBlockExpire,
      };
    }

    const totalHits = await this.redis.incr(key);

    if (totalHits === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    const timeToExpire = await this.redis.ttl(key);

    if (totalHits > limit && blockDuration > 0) {
      await this.redis.setex(blockKey, Math.ceil(blockDuration / 1000), '1');

      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
