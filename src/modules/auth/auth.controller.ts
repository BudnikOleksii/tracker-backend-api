import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/shared/guards/index.js';

import { AuthService } from './auth.service.js';
import { LoginDto, AuthResponseDto } from './dtos/login.dto.js';
import { LogoutDto } from './dtos/logout.dto.js';
import { RefreshTokenDto } from './dtos/refresh-token.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { RevokeSessionDto } from './dtos/revoke-session.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
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
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current session info' })
  async getSession(
    @Request()
    req: Express.Request & { user: { id: string; email: string; role: string; sessionId: string } },
  ) {
    return this.authService.getSession(
      req.user.sessionId,
      req.user.id,
      req.user.email,
      req.user.role,
    );
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions' })
  async listSessions(
    @Request() req: Express.Request & { user: { id: string; sessionId: string } },
  ) {
    return this.authService.listSessions(req.user.id, req.user.sessionId);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (single device)' })
  async logout(@Body() dto: LogoutDto) {
    const success = await this.authService.logout(dto.refreshToken);

    return {
      success,
      message: success
        ? 'Logged out successfully'
        : 'Logout failed: session not found or already expired',
    };
  }

  @Post('revoke-session')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @Body() dto: RevokeSessionDto,
    @Request() req: Express.Request & { user: { id: string; sessionId: string } },
  ) {
    return this.authService.revokeSession(dto.sessionId, req.user.id, req.user.sessionId);
  }

  @Post('revoke-sessions')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions' })
  async revokeSessions(@Request() req: Express.Request & { user: { id: string } }) {
    const revokedCount = await this.authService.revokeAllSessions(req.user.id);

    return {
      revokedCount,
      message: `All sessions revoked successfully. Total: ${revokedCount}`,
    };
  }
}
