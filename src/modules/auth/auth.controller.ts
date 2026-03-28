import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '@/shared/guards/index.js';

import { AuthService } from './auth.service.js';
import { LoginDto, AuthResponseDto } from './dtos/login.dto.js';
import { LogoutDto } from './dtos/logout.dto.js';
import { LogoutResponseDto } from './dtos/logout-response.dto.js';
import { RefreshTokenDto } from './dtos/refresh-token.dto.js';
import { RefreshTokenInfoDto } from './dtos/refresh-token-info.dto.js';
import { RefreshTokenListDto } from './dtos/refresh-token-list.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { RevokeRefreshTokenDto } from './dtos/revoke-refresh-token.dto.js';
import { RevokeAllTokensResponseDto } from './dtos/revoke-all-tokens-response.dto.js';
import { RevokeTokenResponseDto } from './dtos/revoke-token-response.dto.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ auth: {} })
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
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
  ) {
    const deviceContext = {
      ipAddress:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'] as string | undefined,
    };

    return this.authService.login(dto.email, dto.password, deviceContext);
  }

  @Post('refresh-token')
  @Throttle({ auth: {} })
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current refresh token info' })
  @ApiResponse({ status: 200, type: RefreshTokenInfoDto })
  async getRefreshToken(@Request() req: AuthenticatedRequest) {
    return this.authService.getRefreshToken(req.user);
  }

  @Get('refresh-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active refresh tokens' })
  @ApiResponse({ status: 200, type: RefreshTokenListDto })
  async listRefreshTokens(@Request() req: AuthenticatedRequest) {
    return this.authService.listRefreshTokens(req.user.id, req.user.sessionId);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (single device)' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  async logout(@Body() dto: LogoutDto) {
    const success = await this.authService.logout(dto.refreshToken);

    return {
      success,
      message: success
        ? 'Logged out successfully'
        : 'Logout failed: refresh token not found or already expired',
    };
  }

  @Post('revoke-refresh-token')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific refresh token' })
  @ApiResponse({ status: 200, type: RevokeTokenResponseDto })
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
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens' })
  @ApiResponse({ status: 200, type: RevokeAllTokensResponseDto })
  async revokeRefreshTokens(@Request() req: AuthenticatedRequest) {
    const revokedCount = await this.authService.revokeAllRefreshTokens(req.user.id);

    return {
      revokedCount,
      message: `All refresh tokens revoked successfully. Total: ${revokedCount}`,
    };
  }
}
