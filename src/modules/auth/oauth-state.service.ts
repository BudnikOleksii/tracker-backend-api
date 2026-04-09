import crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

import type { Env } from '@/app/config/env.schema.js';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class OAuthStateService {
  private readonly cookieSecure: boolean;
  private readonly cookieDomain: string | undefined;

  constructor(configService: ConfigService<Env, true>) {
    this.cookieSecure = configService.get('COOKIE_SECURE', { infer: true });
    this.cookieDomain = configService.get('COOKIE_DOMAIN', { infer: true });
  }

  generateState(res: Response): string {
    const state = crypto.randomBytes(32).toString('hex');

    res.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      maxAge: STATE_TTL_MS,
      path: '/',
      ...(this.cookieDomain ? { domain: this.cookieDomain } : {}),
    });

    return state;
  }

  validateState(req: Request): boolean {
    const cookieState = (req.cookies as Record<string, string>)?.[STATE_COOKIE_NAME];
    const queryState = req.query['state'] as string | undefined;

    if (!cookieState || !queryState) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(cookieState), Buffer.from(queryState));
  }

  clearState(res: Response): void {
    res.clearCookie(STATE_COOKIE_NAME, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'lax',
      path: '/',
      ...(this.cookieDomain ? { domain: this.cookieDomain } : {}),
    });
  }
}
