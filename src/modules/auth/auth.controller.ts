import crypto from 'node:crypto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';

import type { Env } from '@/app/config/env.schema.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { CsrfGuard, JwtAuthGuard } from '@/shared/guards/index.js';

import { AuthService } from './auth.service.js';
import { LoginDto, AuthResponseDto } from './dtos/login.dto.js';
import { LogoutResponseDto } from './dtos/logout-response.dto.js';
import { RefreshTokenInfoDto } from './dtos/refresh-token-info.dto.js';
import { RefreshTokenListDto } from './dtos/refresh-token-list.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { RevokeRefreshTokenDto } from './dtos/revoke-refresh-token.dto.js';
import { RevokeAllTokensResponseDto } from './dtos/revoke-all-tokens-response.dto.js';
import { RevokeTokenResponseDto } from './dtos/revoke-token-response.dto.js';
import type { AuthenticatedRequest, GenerateTokensResult } from './auth.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly cookieName: string;
  private readonly cookieOptions: CookieOptions;
  private readonly csrfCookieName: string;
  private readonly sameSite: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<Env, true>,
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
  }

  @Post('register')
  @Throttle({ auth: {} })
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto.email, dto.password, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

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
    @Request()
    req: {
      headers: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceContext = {
      ipAddress:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string | undefined,
    };

    const result = await this.authService.login(dto.email, dto.password, deviceContext);

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
    @Request() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
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
  async getRefreshToken(@Request() req: AuthenticatedRequest) {
    return this.authService.getRefreshToken(req.user);
  }

  @Get('refresh-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active refresh tokens' })
  @ApiResponse({ status: 200, type: RefreshTokenListDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listRefreshTokens(@Request() req: AuthenticatedRequest) {
    return this.authService.listRefreshTokens(req.user.id, req.user.sessionId);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (single device)' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Request() req: AuthenticatedRequest & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromCookie(req);
    await this.authService.logout(refreshToken, req.user.jti);

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Post('revoke-refresh-token')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific refresh token' })
  @ApiResponse({ status: 200, type: RevokeTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeRefreshToken(
    @Body() dto: RevokeRefreshTokenDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.authService.revokeRefreshToken({
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
  ) {
    const revokedCount = await this.authService.revokeAllRefreshTokens(req.user.id);

    this.clearRefreshTokenCookie(res);

    return {
      revokedCount,
      message: `All refresh tokens revoked successfully. Total: ${revokedCount}`,
    };
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

  private getRefreshTokenFromCookie(req: { cookies?: Record<string, string> }): string {
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
