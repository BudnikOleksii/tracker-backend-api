import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import type { HealthIndicatorResult } from '@nestjs/terminus';

import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';

@Injectable()
export class DrizzleHealthIndicator {
  constructor(
    @Inject(DB_TOKEN) private readonly database: DrizzleDb,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.database.execute(sql`SELECT 1`);

      return indicator.up({ message: 'Database is available' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Database check failed',
      });
    }
  }
}
