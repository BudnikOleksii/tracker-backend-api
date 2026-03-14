import { Injectable, Inject } from '@nestjs/common'

import { CACHE_PORT } from '@/modules/cache/cache.port.js'

import type { CachePort } from '@/modules/cache/cache.port.js'
import type { HealthIndicatorResult } from '@nestjs/terminus'

const PROBE_KEY = '__health_probe__'

@Injectable()
export class RedisHealthIndicator {
  constructor(@Inject(CACHE_PORT) private readonly cache: CachePort) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cache.set(PROBE_KEY, '1', 5)
      await this.cache.get(PROBE_KEY)
      return {
        [key]: {
          status: 'up' as const,
          message: 'Redis is available',
        },
      }
    } catch (error) {
      return {
        [key]: {
          status: 'down' as const,
          message: error instanceof Error ? error.message : 'Redis check failed',
        },
      }
    }
  }
}
