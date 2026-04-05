import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Env } from '@/app/config/env.schema.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { TokenBlacklistService } from './token-blacklist.service.js';

export interface JwtPayload {
  jti: string;
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService<Env, true>,
    private readonly cls: ClsService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        throw new UnauthorizedException({
          code: ErrorCode.TOKEN_INVALID,
          message: 'Token has been revoked',
        });
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Fail-open: Redis unavailability should not block all authenticated requests.
      // The blacklist is defense-in-depth; primary auth is the JWT signature.
      this.logger.warn(
        `Token blacklist check failed for jti=${payload.jti}, allowing request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.cls.set('userId', payload.sub);
    this.cls.set('userEmail', payload.email);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
      jti: payload.jti,
    };
  }
}
