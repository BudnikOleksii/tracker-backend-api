import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { isUniqueViolation } from '@/shared/utils/pg-errors.js';
import type { Env } from '@/app/config/env.schema.js';

import { MailerService } from '../mailer/mailer.service.js';
import { UserService } from '../user/user.service.js';
import { UserRepository } from '../user/user.repository.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { LoginLogRepository } from './login-log.repository.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import type { JwtPayload } from './jwt.strategy.js';
import type {
  DeviceContext,
  GenerateTokensParams,
  GenerateTokensResult,
  GetRefreshTokenParams,
  RefreshTokenInfo,
  RefreshTokenListResult,
  RevokeRefreshTokenParams,
  SocialLoginParams,
  SocialLoginResult,
} from './auth.types.js';

@Injectable()
export class AuthService {
  // Pre-computed bcrypt hash used as a dummy target when a login email is not
  // found. Running bcrypt.compare against it ensures the response time is
  // indistinguishable from a real comparison, preventing email enumeration via
  // timing side-channel attacks. Cost factor 12 matches the application default.
  private static readonly DUMMY_HASH =
    '$2b$12$qMkHw/Qr6k6FOOl3rL6OZ.nRMLR7k0hkmoa8bD.mb1TUBeNvBWAKi';

  private readonly logger = new Logger(AuthService.name);

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly loginLogRepo: LoginLogRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly mailerService: MailerService,
  ) {}

  async register(
    email: string,
    password: string,
    deviceContext?: DeviceContext,
  ): Promise<GenerateTokensResult> {
    const created = await this.userService.create({ email, password });

    const verificationToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      await this.userRepository.setEmailVerificationToken(
        created.id,
        verificationToken,
        tokenExpiresAt,
      );
      void this.mailerService
        .sendVerificationEmail(email, verificationToken)
        .catch((error: unknown) => {
          this.logger.error(
            `Failed to send verification email to ${email}`,
            error instanceof Error ? error.stack : undefined,
          );
        });
    } catch (error) {
      this.logger.error(
        `Failed to set email verification token for user ${created.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    return this.generateTokens({
      userId: created.id,
      email: created.email,
      role: created.role,
      deviceContext,
    });
  }

  async login(
    email: string,
    password: string,
    deviceContext?: DeviceContext,
  ): Promise<GenerateTokensResult> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Perform a dummy bcrypt comparison to equalise response time with the
      // case where the user exists but the password is wrong. This prevents
      // email enumeration via timing side-channel attacks.
      await bcrypt.compare(password, AuthService.DUMMY_HASH);
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

    if (!user.passwordHash) {
      void this.loginLogRepo.create({
        userId: user.id,
        email,
        status: 'failed',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'social_account',
      });
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'This account uses social login. Please sign in with your social provider.',
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

  async socialLogin(params: SocialLoginParams): Promise<SocialLoginResult> {
    const { provider, providerId, email, firstName, lastName, deviceContext } = params;

    const existingByProvider = await this.userService.findByAuthProvider(provider, providerId);
    if (existingByProvider) {
      void this.loginLogRepo.create({
        userId: existingByProvider.id,
        email: existingByProvider.email,
        status: 'success',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
      });

      const tokens = await this.generateTokens({
        userId: existingByProvider.id,
        email: existingByProvider.email,
        role: existingByProvider.role,
        deviceContext,
      });

      return { ...tokens, isNewUser: false };
    }

    const existingByEmail = await this.userService.findByEmail(email);
    if (existingByEmail) {
      void this.loginLogRepo.create({
        userId: existingByEmail.id,
        email,
        status: 'failed',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'email_already_exists',
      });
      throw new ConflictException({
        code: ErrorCode.EMAIL_EXISTS,
        message:
          'An account with this email already exists. Please sign in with your existing method.',
      });
    }

    let newUser;
    try {
      newUser = await this.userService.createSocialUser({
        email,
        authProvider: provider,
        authProviderId: providerId,
        firstName,
        lastName,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: ErrorCode.EMAIL_EXISTS,
          message:
            'An account with this email already exists. Please sign in with your existing method.',
        });
      }
      throw error;
    }

    void this.loginLogRepo.create({
      userId: newUser.id,
      email: newUser.email,
      status: 'success',
      ipAddress: deviceContext?.ipAddress,
      userAgent: deviceContext?.userAgent,
    });

    const tokens = await this.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      deviceContext,
    });

    return { ...tokens, isNewUser: true };
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: true } | { success: false; reason: string }> {
    return this.userRepository.verifyEmail(token);
  }

  async refreshToken(
    refreshToken: string,
    deviceContext?: DeviceContext,
  ): Promise<GenerateTokensResult> {
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
      role: user.role,
      deviceContext,
    });
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

  private async generateTokens(params: GenerateTokensParams): Promise<GenerateTokensResult> {
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
