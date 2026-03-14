import { Inject, Injectable } from '@nestjs/common'
import { eq, lt } from 'drizzle-orm'

import { sessionsTable } from '@/database/schemas/index.js'
import { DB_TOKEN } from '@/database/types.js'

import type { DrizzleDb } from '@/database/types.js'
import type { Session } from '@/database/schemas/index.js'

@Injectable()
export class SessionRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async create(data: {
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }): Promise<Session> {
    const [session] = await this.db.insert(sessionsTable).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    }).returning()
    return session!
  }

  async findById(id: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .limit(1)
    return result[0] ?? null
  }

  async findByToken(token: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1)
    return result[0] ?? null
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const now = new Date()
    const results = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId))
    return results.filter((session) => session.expiresAt > now)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, id))
    return (result.rowCount ?? 0) > 0
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.db
      .delete(sessionsTable)
      .where(eq(sessionsTable.userId, userId))
    return result.rowCount ?? 0
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, new Date()))
    return result.rowCount ?? 0
  }
}
