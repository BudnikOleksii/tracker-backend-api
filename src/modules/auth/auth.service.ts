import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { MS_PER_DAY } from '@/shared/constants/time.constants.js';
import { isUniqueViolation } from '@/shared/utils/pg-errors.js';

import { MailerService } from '../mailer/mailer.service.js';
import { UserService } from '../user/user.service.js';
import { LoginLogRepository } from './login-log.repository.js';
import { TokenService } from './token.service.js';
import type {
  DeviceContext,
  GenerateTokensResult,
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
    private readonly tokenService: TokenService,
    private readonly loginLogRepo: LoginLogRepository,
    private readonly mailerService: MailerService,
  ) {}

  async register(
    email: string,
    password: string,
    deviceContext?: DeviceContext,
  ): Promise<GenerateTokensResult> {
    const created = await this.userService.create({ email, password });

    const verificationToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + MS_PER_DAY);

    try {
      await this.userService.setEmailVerificationToken(
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

    return this.tokenService.generateTokens({
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

    return this.tokenService.generateTokens({
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

      const tokens = await this.tokenService.generateTokens({
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

    const tokens = await this.tokenService.generateTokens({
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
    return this.userService.verifyEmail(token);
  }

  async refreshToken(
    refreshToken: string,
    deviceContext?: DeviceContext,
  ): Promise<GenerateTokensResult> {
    const { userId } = await this.tokenService.consumeRefreshToken(refreshToken);
    const user = await this.userService.findById(userId);

    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceContext,
    });
  }
}
