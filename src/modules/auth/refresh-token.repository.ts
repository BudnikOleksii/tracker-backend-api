import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';

import { refreshTokens } from '@/database/schemas/refresh-tokens.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { Env } from '@/app/config/env.schema.js';

type RefreshToken = typeof refreshTokens.$inferSelect;

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  private hashToken(token: string): string {
    const secret = this.configService.get('JWT_SECRET', { infer: true });

    return createHmac('sha256', secret).update(token).digest('hex');
  }

  async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshToken> {
    const [session] = await this.db
      .insert(refreshTokens)
      .values({
        userId: data.userId,
        token: this.hashToken(data.token),
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      })
      .returning();

    return session as RefreshToken;
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const result = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);
    const result = await this.db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.token, hashedToken), isNull(refreshTokens.revokedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const now = new Date();
    const results = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId));

    return results.filter((rt) => rt.expiresAt > now && rt.revokedAt === null);
  }

  async consumeToken(token: string): Promise<RefreshToken | null> {
    const hashedToken = this.hashToken(token);
    const [deleted] = await this.db
      .delete(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, hashedToken),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .returning();

    return deleted ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(refreshTokens).where(eq(refreshTokens.id, id));

    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

    return result.rowCount ?? 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()));

    return result.rowCount ?? 0;
  }
}
