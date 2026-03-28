import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { Env } from '@/app/config/env.schema.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { UserService } from '../user/user.service.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { LoginLogRepository } from './login-log.repository.js';
import type { JwtPayload } from './jwt.strategy.js';
import type {
  DeviceContext,
  GenerateTokensParams,
  GetRefreshTokenParams,
  RevokeRefreshTokenParams,
} from './auth.types.js';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly loginLogRepo: LoginLogRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async register(
    email: string,
    password: string,
    deviceContext?: DeviceContext & { firstName?: string; lastName?: string },
  ) {
    const created = await this.userService.create({
      email,
      password,
      firstName: deviceContext?.firstName,
      lastName: deviceContext?.lastName,
    });

    return this.generateTokens({
      userId: created.id,
      email: created.email,
      role: created.role as UserRole,
      deviceContext,
    });
  }

  async login(email: string, password: string, deviceContext?: DeviceContext) {
    const user = await this.userService.findByEmail(email);
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

    return this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceContext,
    });
  }

  async refreshToken(refreshToken: string, deviceContext?: DeviceContext) {
    const token = await this.refreshTokenRepo.consumeToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
      });
    }

    const user = await this.userService.findById(token.userId);

    return this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      deviceContext,
    });
  }

  async logout(refreshToken: string): Promise<boolean> {
    const token = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!token) {
      return false;
    }

    return this.refreshTokenRepo.delete(token.id);
  }

  async revokeAllRefreshTokens(userId: string): Promise<number> {
    return this.refreshTokenRepo.deleteAllByUserId(userId);
  }

  async revokeRefreshToken(
    params: RevokeRefreshTokenParams,
  ): Promise<{ success: boolean; message: string }> {
    const { sessionId, userId, currentSessionId } = params;

    if (sessionId === currentSessionId) {
      return { success: false, message: 'Cannot revoke the current session; use logout instead' };
    }

    const token = await this.refreshTokenRepo.findById(sessionId);
    if (token?.userId !== userId) {
      return { success: false, message: 'Refresh token not found or insufficient permissions' };
    }

    const deleted = await this.refreshTokenRepo.delete(sessionId);

    return { success: deleted, message: deleted ? 'Refresh token revoked' : 'Revocation failed' };
  }

  async getRefreshToken(params: GetRefreshTokenParams) {
    const { sessionId, id, email, role } = params;

    const token = await this.refreshTokenRepo.findById(sessionId);
    if (!token || token.userId !== id) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token not found or has expired',
      });
    }

    return {
      user: { id, email, role },
      refreshToken: {
        id: token.id,
        expiresAt: token.expiresAt,
        ipAddress: token.ipAddress,
        userAgent: token.userAgent,
      },
    };
  }

  async listRefreshTokens(userId: string, currentSessionId: string) {
    const tokens = await this.refreshTokenRepo.findActiveByUserId(userId);

    return {
      refreshTokens: tokens.map((t) => ({
        id: t.id,
        ipAddress: t.ipAddress,
        userAgent: t.userAgent,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        isCurrent: t.id === currentSessionId,
      })),
    };
  }

  private async generateTokens(params: GenerateTokensParams) {
    const { userId, email, role, deviceContext } = params;
    const refreshToken = randomUUID();

    const refreshExpiresIn =
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ?? '7d';
    const expiresAt = this.parseExpiration(refreshExpiresIn);

    const storedToken = await this.refreshTokenRepo.create({
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
      sessionId: storedToken.id,
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
