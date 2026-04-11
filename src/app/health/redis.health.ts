import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '@nestjs/terminus';

import { CacheService } from '@/modules/cache/cache.service.js';

const PROBE_KEY = '__health_probe__';

@Injectable()
export class RedisHealthIndicator {
  constructor(private readonly cache: CacheService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cache.set(PROBE_KEY, '1', 5);
      await this.cache.get(PROBE_KEY);

      return {
        [key]: {
          status: 'up' as const,
          message: 'Redis is available',
        },
      };
    } catch (error) {
      return {
        [key]: {
          status: 'down' as const,
          message: error instanceof Error ? error.message : 'Redis check failed',
        },
      };
    }
  }
}
