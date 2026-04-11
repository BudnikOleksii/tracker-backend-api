import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

import { CacheService } from '@/modules/cache/cache.service.js';

const BLACKLIST_KEY_PREFIX = 'token:blacklist:';
const LRU_MAX_ENTRIES = 10_000;
const LRU_TTL_MS = 30_000;

@Injectable()
export class TokenBlacklistService {
  private readonly lru = new LRUCache<string, true>({
    max: LRU_MAX_ENTRIES,
    ttl: LRU_TTL_MS,
  });

  constructor(private readonly cacheService: CacheService) {}

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    this.lru.delete(jti);

    const key = this.buildKey(jti);
    await this.cacheService.set(key, true, ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    if (this.lru.has(jti)) {
      return false;
    }

    const key = this.buildKey(jti);
    const value = await this.cacheService.get<boolean>(key);

    if (value === true) {
      return true;
    }

    this.lru.set(jti, true);

    return false;
  }

  private buildKey(jti: string): string {
    return `${BLACKLIST_KEY_PREFIX}${jti}`;
  }
}
