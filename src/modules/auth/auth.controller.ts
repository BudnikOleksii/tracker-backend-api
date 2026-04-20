import crypto from 'node:crypto';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';

import type { Env } from '@/app/config/env.schema.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { CsrfGuard } from '@/shared/guards/csrf.guard.js';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard.js';
import type { DeviceContext } from '@/shared/types/device-context.js';
import type { HttpRequest, RequestWithCookies } from '@/shared/types/http-request.js';
import { convertHeaderToString } from '@/shared/utils/header.utils.js';

import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { ExchangeSocialCodeDto } from './dtos/exchange-social-code.dto.js';
import { GitHubOAuthGuard } from './github-oauth.guard.js';
import { GoogleOAuthGuard } from './google-oauth.guard.js';
import { SocialAuthCodeService } from './social-auth-code.service.js';
import { LoginDto, AuthResponseDto } from './dtos/login.dto.js';
import { LogoutResponseDto } from './dtos/logout-response.dto.js';
import { RefreshTokenInfoDto } from './dtos/refresh-token-info.dto.js';
import { RefreshTokenListDto } from './dtos/refresh-token-list.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { RevokeRefreshTokenDto } from './dtos/revoke-refresh-token.dto.js';
import { RevokeAllTokensResponseDto } from './dtos/revoke-all-tokens-response.dto.js';
import { RevokeTokenResponseDto } from './dtos/revoke-token-response.dto.js';
import { SocialExchangeResponseDto } from './dtos/social-exchange-response.dto.js';
import type {
  AuthenticatedRequest,
  GenerateTokensResult,
  RefreshTokenInfo,
  RefreshTokenListResult,
  SocialLoginParams,
} from './auth.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly cookieName: string;
  private readonly cookieOptions: CookieOptions;
  private readonly csrfCookieName: string;
  private readonly sameSite: Env['COOKIE_SAME_SITE'];
  private readonly socialAuthRedirectUrl: string | undefined;

  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService<Env, true>,
    private readonly socialAuthCodeService: SocialAuthCodeService,
  ) {
    this.cookieName = this.configService.get('REFRESH_TOKEN_COOKIE_NAME', { infer: true });
    this.csrfCookieName = this.configService.get('CSRF_TOKEN_COOKIE_NAME', { infer: true });
    this.sameSite = this.configService.get('COOKIE_SAME_SITE', { infer: true });
    const domain = this.configService.get('COOKIE_DOMAIN', { infer: true });

    this.cookieOptions = {
      httpOnly: true,
      secure: this.configService.get('COOKIE_SECURE', { infer: true }),
      sameSite: this.configService.get('COOKIE_SAME_SITE', { infer: true }),
      path: this.configService.get('COOKIE_PATH', { infer: true }),
      ...(domain ? { domain } : {}),
    };
    this.socialAuthRedirectUrl = this.configService.get('SOCIAL_AUTH_REDIRECT_URL', {
      infer: true,
    });
  }

  @Post('register')
  @Throttle({ auth: {} })
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto.email, dto.password);

    this.setRefreshTokenCookie(res, result);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('login')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Request() req: HttpRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(
      dto.email,
      dto.password,
      this.buildDeviceContext(req),
    );

    this.setRefreshTokenCookie(res, result);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh-token')
  @Throttle({ auth: {} })
  @UseGuards(CsrfGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(
    @Request() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(req);
    const result = await this.authService.refreshToken(refreshToken);

    this.setRefreshTokenCookie(res, result);

    return { accessToken: result.accessToken, user: result.user };
  }

  @Get('refresh-token/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current refresh token info' })
  @ApiResponse({ status: 200, type: RefreshTokenInfoDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRefreshToken(@Request() req: AuthenticatedRequest): Promise<RefreshTokenInfo> {
    return this.tokenService.getRefreshToken(req.user);
  }

  @Get('refresh-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active refresh tokens' })
  @ApiResponse({ status: 200, type: RefreshTokenListDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listRefreshTokens(@Request() req: AuthenticatedRequest): Promise<RefreshTokenListResult> {
    return this.tokenService.listRefreshTokens(req.user.id, req.user.sessionId);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (single device)' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Request() req: AuthenticatedRequest & RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(req);
    await this.tokenService.logout(refreshToken, req.user.jti);

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Post('revoke-refresh-token')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific refresh token' })
  @ApiResponse({ status: 200, type: RevokeTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeRefreshToken(
    @Body() dto: RevokeRefreshTokenDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<RevokeTokenResponseDto> {
    return this.tokenService.revokeRefreshToken({
      sessionId: dto.sessionId,
      userId: req.user.id,
      currentSessionId: req.user.sessionId,
    });
  }

  @Post('revoke-refresh-tokens')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens' })
  @ApiResponse({ status: 200, type: RevokeAllTokensResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeRefreshTokens(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RevokeAllTokensResponseDto> {
    const revokedCount = await this.tokenService.revokeAllRefreshTokens(req.user.id);

    this.clearRefreshTokenCookie(res);

    return {
      revokedCount,
      message: `All refresh tokens revoked successfully. Total: ${revokedCount}`,
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via token' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with result' })
  async verifyEmail(
    @Query('token', ParseUUIDPipe) token: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl =
      this.configService.get('EMAIL_VERIFICATION_REDIRECT_URL', { infer: true }) ??
      this.socialAuthRedirectUrl;

    if (!redirectUrl) {
      throw new InternalServerErrorException('Email verification redirect URL is not configured');
    }

    const result = await this.authService.verifyEmail(token);

    const url = new URL(redirectUrl);
    if (result.success) {
      url.searchParams.set('status', 'success');
    } else {
      url.searchParams.set('status', 'error');
      url.searchParams.set('error', result.reason);
    }
    res.redirect(url.toString());
  }

  @Get('providers')
  @ApiOperation({ summary: 'List enabled authentication providers' })
  @ApiResponse({ status: 200 })
  getProviders(): { providers: { id: string; enabled: boolean }[] } {
    return {
      providers: [
        { id: 'google', enabled: !!this.configService.get('GOOGLE_CLIENT_ID', { infer: true }) },
        { id: 'github', enabled: !!this.configService.get('GITHUB_CLIENT_ID', { infer: true }) },
      ],
    };
  }

  @Get('google')
  @Throttle({ auth: {} })
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  googleLogin(): void {
    // Guard handles redirect
  }

  @Get('google/callback')
  @Throttle({ auth: {} })
  @UseGuards(GoogleOAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(
    @Request() req: { user: SocialLoginParams } & HttpRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleSocialCallback(req, res);
  }

  @Get('github')
  @Throttle({ auth: {} })
  @UseGuards(GitHubOAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth authorization screen' })
  githubLogin(): void {
    // Guard handles redirect
  }

  @Get('github/callback')
  @Throttle({ auth: {} })
  @UseGuards(GitHubOAuthGuard)
  @ApiExcludeEndpoint()
  async githubCallback(
    @Request() req: { user: SocialLoginParams } & HttpRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleSocialCallback(req, res);
  }

  @Post('social/exchange')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange social auth code for tokens' })
  @ApiResponse({ status: 200, type: SocialExchangeResponseDto })
  async exchangeSocialCode(
    @Body() dto: ExchangeSocialCodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SocialExchangeResponseDto> {
    const stored = await this.socialAuthCodeService.exchangeCode(dto.code);

    if (!stored) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Invalid or expired authorization code',
      });
    }

    const refreshExpiresAt = new Date(stored.refreshExpiresAt);
    this.setRefreshTokenCookie(res, { ...stored, refreshExpiresAt });

    return { accessToken: stored.accessToken, user: stored.user, isNewUser: stored.isNewUser };
  }

  private async handleSocialCallback(
    req: { user: SocialLoginParams } & HttpRequest,
    res: Response,
  ): Promise<void> {
    if (!this.socialAuthRedirectUrl) {
      throw new InternalServerErrorException('Social auth redirect URL is not configured');
    }
    const redirectUrl = this.socialAuthRedirectUrl;

    try {
      const result = await this.authService.socialLogin({
        ...req.user,
        deviceContext: this.buildDeviceContext(req),
      });

      const code = await this.socialAuthCodeService.createCode(result, result.isNewUser);

      const url = new URL(redirectUrl);
      url.searchParams.set('code', code);
      res.redirect(url.toString());
    } catch (error) {
      const reason = this.getSocialAuthErrorReason(error);

      if (error instanceof ConflictException || error instanceof UnauthorizedException) {
        this.logger.warn({ reason }, 'Social auth callback rejected');
      } else {
        this.logger.error(
          'Social auth callback failed',
          error instanceof Error ? error.stack : undefined,
        );
      }

      const url = new URL(redirectUrl);
      url.searchParams.set('error', 'auth_failed');
      url.searchParams.set('reason', reason);
      res.redirect(url.toString());
    }
  }

  private getSocialAuthErrorReason(error: unknown): string {
    if (error instanceof ConflictException) {
      const code = this.extractErrorCode(error);
      if (code === ErrorCode.EMAIL_UNVERIFIED_LOCAL) {
        return 'email_unverified_local';
      }
      if (code === ErrorCode.EMAIL_UNVERIFIED_PROVIDER) {
        return 'email_unverified_provider';
      }

      return 'email_exists';
    }
    if (error instanceof UnauthorizedException) {
      return 'unauthorized';
    }

    return 'unknown';
  }

  private extractErrorCode(error: ConflictException): string | undefined {
    const response = error.getResponse();
    if (typeof response === 'object' && response !== null && 'code' in response) {
      const code = (response as { code: unknown }).code;
      if (typeof code === 'string') {
        return code;
      }
    }

    return undefined;
  }

  private setRefreshTokenCookie(res: Response, result: GenerateTokensResult): void {
    const maxAge = result.refreshExpiresAt.getTime() - Date.now();

    res.cookie(this.cookieName, result.refreshToken, {
      ...this.cookieOptions,
      maxAge,
    });

    if (this.sameSite === 'none') {
      const csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie(this.csrfCookieName, csrfToken, {
        ...this.cookieOptions,
        httpOnly: false,
        maxAge,
      });
    }
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(this.cookieName, this.cookieOptions);

    if (this.sameSite === 'none') {
      res.clearCookie(this.csrfCookieName, { ...this.cookieOptions, httpOnly: false });
    }
  }

  private buildDeviceContext(req: HttpRequest): DeviceContext {
    return {
      ipAddress:
        convertHeaderToString(req.headers['x-forwarded-for'])?.split(',')[0]?.trim() ??
        req.socket?.remoteAddress,
      userAgent: convertHeaderToString(req.headers['user-agent']),
    };
  }

  private getRefreshTokenFromCookie(req: RequestWithCookies): string {
    const token = req.cookies?.[this.cookieName];

    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_INVALID,
        message: 'Refresh token not found',
      });
    }

    return token;
  }
}
