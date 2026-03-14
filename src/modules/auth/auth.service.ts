import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { users } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { Env } from '@/app/config/env.schema.js';
import type { DrizzleDb } from '@/database/types.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { SessionRepository } from './session.repository.js';
import { LoginLogRepository } from './login-log.repository.js';
import type { JwtPayload } from './jwt.strategy.js';

const BCRYPT_ROUNDS = 12;

interface DeviceContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DrizzleDb,
    private readonly sessionRepo: SessionRepository,
    private readonly loginLogRepo: LoginLogRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async register(email: string, password: string, deviceContext?: DeviceContext) {
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_EXISTS,
        message: 'This email is already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [user] = await this.db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        role: 'USER',
      })
      .returning();

    const created = user as NonNullable<typeof user>;

    return this.generateTokens(created.id, created.email, created.role, deviceContext);
  }

  async login(email: string, password: string, deviceContext?: DeviceContext) {
    const userRows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      void this.loginLogRepo.create({
        email,
        status: 'failed',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'user_not_found',
      });
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      void this.loginLogRepo.create({
        userId: user.id,
        email,
        status: 'failed',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'invalid_password',
      });
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    void this.loginLogRepo.create({
      userId: user.id,
      email,
      status: 'success',
      ipAddress: deviceContext?.ipAddress,
      userAgent: deviceContext?.userAgent,
    });

    return this.generateTokens(user.id, user.email, user.role, deviceContext);
  }

  async refreshToken(refreshToken: string, deviceContext?: DeviceContext) {
    const session = await this.sessionRepo.findByToken(refreshToken);
    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
      });
    }

    await this.sessionRepo.delete(session.id);

    const userRows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      throw new UnauthorizedException({ code: ErrorCode.TOKEN_INVALID, message: 'User not found' });
    }

    return this.generateTokens(user.id, user.email, user.role, deviceContext);
  }

  async logout(refreshToken: string): Promise<boolean> {
    const session = await this.sessionRepo.findByToken(refreshToken);
    if (!session) {
      return false;
    }

    return this.sessionRepo.delete(session.id);
  }

  async revokeAllSessions(userId: string): Promise<number> {
    return this.sessionRepo.deleteAllByUserId(userId);
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    currentSessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    if (sessionId === currentSessionId) {
      return { success: false, message: 'Cannot revoke the current session; use logout instead' };
    }

    const session = await this.sessionRepo.findById(sessionId);
    if (session?.userId !== userId) {
      return { success: false, message: 'Session not found or insufficient permissions' };
    }

    const deleted = await this.sessionRepo.delete(sessionId);

    return { success: deleted, message: deleted ? 'Session revoked' : 'Revocation failed' };
  }

  async getSession(sessionId: string, userId: string, email: string, role: string) {
    const session = await this.sessionRepo.findById(sessionId);
    if (session?.userId !== userId) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Session not found or has expired',
      });
    }

    return {
      user: { id: userId, email, role },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionRepo.findActiveByUserId(userId);

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentSessionId,
      })),
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    deviceContext?: DeviceContext,
  ) {
    const refreshToken = randomUUID();

    const refreshExpiresIn =
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ?? '7d';
    const expiresAt = this.parseExpiration(refreshExpiresIn);

    const session = await this.sessionRepo.create({
      userId,
      token: refreshToken,
      expiresAt,
      ipAddress: deviceContext?.ipAddress,
      userAgent: deviceContext?.userAgent,
    });

    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      sessionId: session.id,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role },
    };
  }

  private parseExpiration(expiresIn: string): Date {
    const now = new Date();
    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number.parseInt(match[1] as string, 10);
    const unit = match[2] as string;

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + value * (multipliers[unit] as number));
  }
}
