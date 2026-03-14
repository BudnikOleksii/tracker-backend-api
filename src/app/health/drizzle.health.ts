import { Injectable, Inject } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { DB_TOKEN } from '@/database/types.js'

import type { DrizzleDb } from '@/database/types.js'
import type { HealthIndicatorResult } from '@nestjs/terminus'

@Injectable()
export class DrizzleHealthIndicator {
  constructor(@Inject(DB_TOKEN) private readonly database: DrizzleDb) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.database.execute(sql`SELECT 1`)
      return {
        [key]: {
          status: 'up' as const,
          message: 'Database is available',
        },
      }
    } catch (error) {
      return {
        [key]: {
          status: 'down' as const,
          message: error instanceof Error ? error.message : 'Database check failed',
        },
      }
    }
  }
}
