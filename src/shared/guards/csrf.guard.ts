import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import type { Env } from '@/app/config/env.schema.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly sameSite: string;
  private readonly csrfCookieName: string;

  constructor(private readonly configService: ConfigService<Env, true>) {
    this.sameSite = this.configService.get('COOKIE_SAME_SITE', { infer: true });
    this.csrfCookieName = this.configService.get('CSRF_TOKEN_COOKIE_NAME', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.sameSite !== 'none') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerToken = request.headers['x-csrf-token'] as string | undefined;
    const cookieToken = request.cookies?.[this.csrfCookieName] as string | undefined;

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Invalid or missing CSRF token',
      });
    }

    return true;
  }
}
