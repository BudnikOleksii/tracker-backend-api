import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { CacheService } from '@/modules/cache/cache.service.js';

import type { GenerateTokensResult } from './auth.types.js';

const CODE_PREFIX = 'social-auth-code:';
const CODE_TTL_SECONDS = 60;

export interface StoredSocialAuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
  user: GenerateTokensResult['user'];
  isNewUser: boolean;
}

@Injectable()
export class SocialAuthCodeService {
  constructor(private readonly cacheService: CacheService) {}

  async createCode(result: GenerateTokensResult, isNewUser: boolean): Promise<string> {
    const code = randomUUID();
    const stored: StoredSocialAuthResult = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      refreshExpiresAt: result.refreshExpiresAt.toISOString(),
      user: result.user,
      isNewUser,
    };

    await this.cacheService.set(`${CODE_PREFIX}${code}`, stored, CODE_TTL_SECONDS);

    return code;
  }

  async exchangeCode(code: string): Promise<StoredSocialAuthResult | undefined> {
    const key = `${CODE_PREFIX}${code}`;
    const stored = await this.cacheService.get<StoredSocialAuthResult>(key);

    if (stored) {
      await this.cacheService.del(key);
    }

    return stored;
  }
}
