import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

import type { Env } from '@/app/config/env.schema.js';

import type { SocialLoginParams } from './auth.types.js';

interface GoogleProfile {
  id: string;
  emails?: { value: string; verified?: boolean }[];
  name?: { givenName?: string; familyName?: string };
}

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

  validate(_accessToken: string, _refreshToken: string, profile: GoogleProfile): SocialLoginParams {
    const primaryEmail = profile.emails?.[0];

    if (!primaryEmail) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      provider: 'GOOGLE',
      providerId: profile.id,
      email: primaryEmail.value,
      emailVerified: primaryEmail.verified === true,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
    };
  }
}
