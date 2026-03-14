import { Inject, Injectable } from '@nestjs/common'

import { loginLogsTable } from '@/database/schemas/index.js'
import { DB_TOKEN } from '@/database/types.js'

import type { DrizzleDb } from '@/database/types.js'

export interface LoginLogEntry {
  userId?: string
  email: string
  status: 'success' | 'failed'
  ipAddress?: string
  userAgent?: string
  failReason?: string
}

@Injectable()
export class LoginLogRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async create(entry: LoginLogEntry): Promise<void> {
    await this.db.insert(loginLogsTable).values({
      userId: entry.userId ?? null,
      email: entry.email,
      status: entry.status,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
      failReason: entry.failReason ?? null,
    })
  }
}
