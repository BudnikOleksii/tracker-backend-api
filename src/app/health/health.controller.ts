import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

import { DrizzleHealthIndicator } from './drizzle.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import type { Env } from '../config/env.schema.js';

interface HealthEntry {
  status: 'up' | 'down';
  message: string;
}

@Controller('health')
@ApiTags('health')
export class HealthController {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly health: HealthCheckService,
    private readonly drizzle: DrizzleHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check' })
  @ApiResponse({ status: 200, description: 'All components are healthy' })
  @ApiResponse({ status: 503, description: 'One or more components are unhealthy' })
  async check() {
    try {
      const result = await this.health.check([
        () => this.drizzle.isHealthy('database'),
        () => this.redis.isHealthy('redis'),
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
        () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      ]);

      const defaultMessages: Record<string, string> = {
        memory_heap: 'Heap memory usage is within threshold',
        memory_rss: 'RSS memory usage is within threshold',
        storage: 'Disk usage is within threshold',
      };

      const details: Record<string, HealthEntry> = {};
      for (const [key, value] of Object.entries(result.details)) {
        const status = value.status as 'up' | 'down';
        const message =
          typeof value.message === 'string' ? value.message : (defaultMessages[key] ?? 'OK');
        details[key] = { status, message };
      }

      const environment: Env['NODE_ENV'] = this.config.get('NODE_ENV');

      return { environment, ...details };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        const response = error.getResponse() as Record<string, unknown>;
        const detail = this.formatHealthCheckErrors(response.error);
        throw new ServiceUnavailableException(detail);
      }
      throw error;
    }
  }

  private formatHealthCheckErrors(errors: unknown): string {
    if (typeof errors !== 'object' || errors === null) {
      return 'Health check failed';
    }

    const details: string[] = [];
    for (const [key, value] of Object.entries(errors)) {
      if (typeof value === 'object' && value !== null) {
        const info = value as Record<string, unknown>;
        const rawMessage = info.message ?? info.error ?? 'check failed';
        const message = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
        details.push(`${key}: ${message}`);
      }
    }

    return details.length > 0 ? details.join('; ') : 'Health check failed';
  }
}
