import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '@/modules/cache/redis.provider.js';

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

interface MemoryEntry {
  hits: number;
  expiresAt: number;
  blockedUntil: number;
}

const MEMORY_CLEANUP_INTERVAL_MS = 60_000;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly memoryStore = new Map<string, MemoryEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.cleanupTimer = setInterval(
      () => this.cleanExpiredMemoryEntries(),
      MEMORY_CLEANUP_INTERVAL_MS,
    );
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
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
      return await this.performRedisIncrement({ key, ttl, limit, blockDuration });
    } catch (error) {
      this.logger.warn('Redis throttler unavailable, falling back to in-memory store', error);

      return this.performMemoryIncrement({ key, ttl, limit, blockDuration });
    }
  }

  private async performRedisIncrement(params: IncrementParams): Promise<ThrottlerStorageRecord> {
    const { key, ttl, limit, blockDuration } = params;
    const ttlSeconds = Math.ceil(ttl / 1000);
    const blockKey = `${key}:blocked`;

    const isBlocked = await this.redis.exists(blockKey);
    if (isBlocked) {
      const timeToBlockExpire = await this.redis.ttl(blockKey);
      const totalHits = Number.parseInt((await this.redis.get(key)) ?? '0', 10);

      return { totalHits, timeToExpire: ttlSeconds, isBlocked: true, timeToBlockExpire };
    }

    const totalHits = await this.redis.incr(key);

    if (totalHits === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    const timeToExpire = await this.redis.ttl(key);

    if (totalHits > limit && blockDuration > 0) {
      const blockDurationSeconds = Math.ceil(blockDuration / 1000);
      await this.redis.setex(blockKey, blockDurationSeconds, '1');

      return { totalHits, timeToExpire, isBlocked: true, timeToBlockExpire: blockDurationSeconds };
    }

    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }

  private performMemoryIncrement(params: IncrementParams): ThrottlerStorageRecord {
    const { key, ttl, limit, blockDuration } = params;
    const now = Date.now();
    const ttlSeconds = Math.ceil(ttl / 1000);

    const existing = this.memoryStore.get(key);

    if (existing && existing.blockedUntil > now) {
      const timeToBlockExpire = Math.ceil((existing.blockedUntil - now) / 1000);

      return {
        totalHits: existing.hits,
        timeToExpire: Math.ceil((existing.expiresAt - now) / 1000),
        isBlocked: true,
        timeToBlockExpire,
      };
    }

    const entry = this.resolveMemoryEntry(existing, now, ttl);
    entry.hits += 1;

    if (entry.hits > limit && blockDuration > 0) {
      entry.blockedUntil = now + blockDuration;
      this.memoryStore.set(key, entry);

      return {
        totalHits: entry.hits,
        timeToExpire: ttlSeconds,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    this.memoryStore.set(key, entry);
    const timeToExpire = Math.ceil((entry.expiresAt - now) / 1000);

    return { totalHits: entry.hits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }

  private resolveMemoryEntry(
    existing: MemoryEntry | undefined,
    now: number,
    ttl: number,
  ): MemoryEntry {
    if (existing && existing.expiresAt > now) {
      return existing;
    }

    return { hits: 0, expiresAt: now + ttl, blockedUntil: 0 };
  }

  private cleanExpiredMemoryEntries(): void {
    const now = Date.now();

    for (const [key, entry] of this.memoryStore.entries()) {
      const isExpired = entry.expiresAt <= now && entry.blockedUntil <= now;
      if (isExpired) {
        this.memoryStore.delete(key);
      }
    }
  }
}
