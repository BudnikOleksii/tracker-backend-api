import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { HealthIndicatorResult } from '@nestjs/terminus';

import { CacheService } from '@/modules/cache/cache.service.js';

const PROBE_KEY = '__health_probe__';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly cache: CacheService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.cache.set(PROBE_KEY, '1', 5);
      await this.cache.get(PROBE_KEY);

      return indicator.up({ message: 'Redis is available' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis check failed',
      });
    }
  }
}
