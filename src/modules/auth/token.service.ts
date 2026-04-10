import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { Env } from '@/app/config/env.schema.js';

import { RefreshTokenRepository } from './refresh-token.repository.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import type { JwtPayload } from './jwt.strategy.js';
import type {
  GenerateTokensParams,
  GenerateTokensResult,
  GetRefreshTokenParams,
  RefreshTokenInfo,
  RefreshTokenListResult,
  RevokeRefreshTokenParams,
} from './auth.types.js';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async generateTokens(params: GenerateTokensParams): Promise<GenerateTokensResult> {
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
      jti: randomUUID(),
      sub: userId,
      email,
      role,
      sessionId: storedToken.id,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt,
      user: { id: userId, email, role },
    };
  }

  async consumeRefreshToken(refreshToken: string): Promise<{ userId: string }> {
    const token = await this.refreshTokenRepo.consumeToken(refreshToken);
    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid refresh token',
      });
    }

    return { userId: token.userId };
  }

  async logout(refreshToken: string, accessTokenJti: string): Promise<void> {
    const token = await this.refreshTokenRepo.findByToken(refreshToken);
    if (token) {
      await this.refreshTokenRepo.delete(token.id);
    }

    try {
      await this.blacklistAccessToken(accessTokenJti);
    } catch (error) {
      this.logger.warn('Failed to blacklist access token during logout', error);
    }
  }

  async blacklistAccessToken(jti: string): Promise<void> {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', { infer: true });
    const ttlSeconds = this.parseExpirationToSeconds(expiresIn);

    await this.tokenBlacklistService.blacklistToken(jti, ttlSeconds);
  }

  async revokeAllRefreshTokens(userId: string): Promise<number> {
    return this.refreshTokenRepo.deleteAllByUserId(userId);
  }

  async deleteExpiredTokens(): Promise<number> {
    return this.refreshTokenRepo.deleteExpired();
  }

  async revokeRefreshToken(params: RevokeRefreshTokenParams): Promise<{ message: string }> {
    const { sessionId, userId, currentSessionId } = params;

    if (sessionId === currentSessionId) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Cannot revoke the current session; use logout instead',
      });
    }

    const token = await this.refreshTokenRepo.findById(sessionId);
    if (token?.userId !== userId) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Refresh token not found or insufficient permissions',
      });
    }

    await this.refreshTokenRepo.delete(sessionId);

    return { message: 'Refresh token revoked' };
  }

  async getRefreshToken(params: GetRefreshTokenParams): Promise<RefreshTokenInfo> {
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

  async listRefreshTokens(
    userId: string,
    currentSessionId: string,
  ): Promise<RefreshTokenListResult> {
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

  private parseExpiration(expiresIn: string): Date {
    const ttlSeconds = this.parseExpirationToSeconds(expiresIn);

    return new Date(Date.now() + ttlSeconds * 1000);
  }

  private parseExpirationToSeconds(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);

    if (!match) {
      return 7 * 24 * 60 * 60;
    }

    const value = Number.parseInt(match[1] as string, 10);
    const unit = match[2] as string;

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * (multipliers[unit] as number);
  }
}
