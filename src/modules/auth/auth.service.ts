import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { MS_PER_DAY } from '@/shared/constants/time.constants.js';
import { isUniqueViolation } from '@/shared/utils/pg-errors.js';
import type { DeviceContext } from '@/shared/types/device-context.js';
import type { UserIdentity } from '@/shared/types/user-identity.js';

import { MailerService } from '../mailer/mailer.service.js';
import { UserService } from '../user/user.service.js';
import { LoginLogRepository } from './login-log.repository.js';
import { TokenService } from './token.service.js';
import type { GenerateTokensResult, SocialLoginParams, SocialLoginResult } from './auth.types.js';

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
        status: 'FAILED',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'user_not_found',
      });
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // passwordHash null ⇔ no LOCAL identity (enforced by `updatePasswordHashWithLocalIdentity`
    // and by the two-insert transaction in `UserRepository.create`). Skipping the extra
    // `hasLocalIdentity` round-trip keeps the login path at one user query.
    if (!user.passwordHash) {
      void this.loginLogRepo.create({
        userId: user.id,
        email,
        status: 'FAILED',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'social_account',
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
        status: 'FAILED',
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
      status: 'SUCCESS',
      ipAddress: deviceContext?.ipAddress,
      userAgent: deviceContext?.userAgent,
    });

    if (deviceContext) {
      void this.userService.updateDeviceContext(user.id, deviceContext);
    }

    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceContext,
    });
  }

  async socialLogin(params: SocialLoginParams): Promise<SocialLoginResult> {
    const { provider, providerId, email, emailVerified, firstName, lastName, deviceContext } =
      params;

    const existingByProvider = await this.userService.findByAuthProvider(provider, providerId);
    if (existingByProvider) {
      return this.loginAsExistingUser(existingByProvider.user, deviceContext);
    }

    const existingByEmail = await this.userService.findByEmail(email);
    if (existingByEmail) {
      if (!existingByEmail.emailVerified) {
        void this.loginLogRepo.create({
          userId: existingByEmail.id,
          email,
          status: 'FAILED',
          ipAddress: deviceContext?.ipAddress,
          userAgent: deviceContext?.userAgent,
          failReason: 'email_unverified_local',
        });
        throw new ConflictException({
          code: ErrorCode.EMAIL_UNVERIFIED_LOCAL,
          message:
            'An account with this email exists but the email is not verified. Please verify your email before linking a social provider.',
        });
      }

      if (!emailVerified) {
        void this.loginLogRepo.create({
          userId: existingByEmail.id,
          email,
          status: 'FAILED',
          ipAddress: deviceContext?.ipAddress,
          userAgent: deviceContext?.userAgent,
          failReason: 'email_unverified_provider',
        });
        throw new ConflictException({
          code: ErrorCode.EMAIL_UNVERIFIED_PROVIDER,
          message:
            'The social provider has not verified this email address. Please verify it with the provider before linking.',
        });
      }

      return this.linkAndLogin({
        userId: existingByEmail.id,
        provider,
        providerId,
        email,
        userForTokens: existingByEmail,
        deviceContext,
      });
    }

    if (!emailVerified) {
      void this.loginLogRepo.create({
        email,
        status: 'FAILED',
        ipAddress: deviceContext?.ipAddress,
        userAgent: deviceContext?.userAgent,
        failReason: 'email_unverified_provider',
      });
      throw new ConflictException({
        code: ErrorCode.EMAIL_UNVERIFIED_PROVIDER,
        message:
          'The social provider has not verified this email address. Please verify it with the provider before creating an account.',
      });
    }

    return this.createNewSocialUser({
      provider,
      providerId,
      email,
      firstName,
      lastName,
      deviceContext,
    });
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

  private async loginAsExistingUser(
    user: UserIdentity,
    deviceContext?: DeviceContext,
  ): Promise<SocialLoginResult> {
    void this.loginLogRepo.create({
      userId: user.id,
      email: user.email,
      status: 'SUCCESS',
      ipAddress: deviceContext?.ipAddress,
      userAgent: deviceContext?.userAgent,
    });

    if (deviceContext) {
      void this.userService.updateDeviceContext(user.id, deviceContext);
    }

    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceContext,
    });

    return { ...tokens, isNewUser: false };
  }

  private async linkAndLogin(args: {
    userId: string;
    provider: SocialLoginParams['provider'];
    providerId: string;
    email: string;
    userForTokens: UserIdentity;
    deviceContext?: DeviceContext;
  }): Promise<SocialLoginResult> {
    try {
      await this.userService.linkIdentity({
        userId: args.userId,
        provider: args.provider,
        providerId: args.providerId,
        emailAtLink: args.email,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Raced with another callback that already created this identity row.
        // Re-fetch and assert it belongs to the user we intended to link, so
        // we never silently hand back tokens for an unrelated principal.
        const existing = await this.userService.findByAuthProvider(args.provider, args.providerId);
        if (existing && existing.user.id === args.userId) {
          return this.loginAsExistingUser(existing.user, args.deviceContext);
        }
        void this.loginLogRepo.create({
          userId: args.userId,
          email: args.email,
          status: 'FAILED',
          ipAddress: args.deviceContext?.ipAddress,
          userAgent: args.deviceContext?.userAgent,
          failReason: 'link_conflict',
        });
        throw new ConflictException({
          code: ErrorCode.RESOURCE_CONFLICT,
          message: 'This social identity is already linked to a different account.',
        });
      }
      throw error;
    }

    return this.loginAsExistingUser(args.userForTokens, args.deviceContext);
  }

  private async createNewSocialUser(args: {
    provider: SocialLoginParams['provider'];
    providerId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    deviceContext?: DeviceContext;
  }): Promise<SocialLoginResult> {
    let newUser;
    try {
      newUser = await this.userService.createSocialUser({
        email: args.email,
        authProvider: args.provider,
        authProviderId: args.providerId,
        firstName: args.firstName,
        lastName: args.lastName,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Raced with another callback that created the user and identity.
        // Retry the provider-identity lookup.
        const existing = await this.userService.findByAuthProvider(args.provider, args.providerId);
        if (existing) {
          return this.loginAsExistingUser(existing.user, args.deviceContext);
        }
        // Race on the email unique index (concurrent local registration with same email).
        void this.loginLogRepo.create({
          email: args.email,
          status: 'FAILED',
          ipAddress: args.deviceContext?.ipAddress,
          userAgent: args.deviceContext?.userAgent,
          failReason: 'email_race_conflict',
        });
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
      status: 'SUCCESS',
      ipAddress: args.deviceContext?.ipAddress,
      userAgent: args.deviceContext?.userAgent,
    });

    if (args.deviceContext) {
      void this.userService.updateDeviceContext(newUser.id, args.deviceContext);
    }

    const tokens = await this.tokenService.generateTokens({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      deviceContext: args.deviceContext,
    });

    return { ...tokens, isNewUser: true };
  }
}
