import { Injectable } from '@nestjs/common';

import { CacheService } from '@/modules/cache/cache.service.js';

const BLACKLIST_KEY_PREFIX = 'token:blacklist:';

@Injectable()
export class TokenBlacklistService {
  constructor(private readonly cacheService: CacheService) {}

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    const key = this.buildKey(jti);
    await this.cacheService.set(key, true, ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = this.buildKey(jti);
    const value = await this.cacheService.get<boolean>(key);

    return value === true;
  }

  private buildKey(jti: string): string {
    return `${BLACKLIST_KEY_PREFIX}${jti}`;
  }
}
