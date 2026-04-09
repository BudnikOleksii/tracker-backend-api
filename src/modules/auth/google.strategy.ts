import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { VerifyCallback } from 'passport-google-oauth20';

import type { Env } from '@/app/config/env.schema.js';

import type { SocialLoginParams } from './auth.types.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService<Env, true>) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET', { infer: true }),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL', { infer: true }),
      scope: ['openid', 'email', 'profile'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/max-params
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string; verified?: boolean }[];
      name?: { givenName?: string; familyName?: string };
    },
    done: VerifyCallback,
  ): void {
    const verifiedEmail = profile.emails?.find((e) => e.verified !== false);

    if (!verifiedEmail) {
      done(new UnauthorizedException('Google account has no verified email'), false);

      return;
    }

    const result: SocialLoginParams = {
      provider: 'GOOGLE',
      providerId: profile.id,
      email: verifiedEmail.value,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
    };

    done(null, result);
  }
}
