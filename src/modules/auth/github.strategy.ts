import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

import type { Env } from '@/app/config/env.schema.js';

import type { SocialLoginParams } from './auth.types.js';

interface GitHubEmail {
  value: string;
  verified?: boolean;
  primary?: boolean;
}

interface GitHubProfile {
  id: string;
  displayName?: string;
  emails?: GitHubEmail[];
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService<Env, true>) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID', { infer: true }),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET', { infer: true }),
      callbackURL: configService.get('GITHUB_CALLBACK_URL', { infer: true }),
      scope: ['user:email', 'read:user'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/max-params
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: (error: Error | null, user?: SocialLoginParams | false) => void,
  ): void {
    const verifiedEmail = profile.emails?.find((e) => e.verified !== false);

    if (!verifiedEmail) {
      done(new UnauthorizedException('GitHub account has no verified email'), false);

      return;
    }

    const email = verifiedEmail.value;

    const nameParts = profile.displayName?.split(' ');

    const result: SocialLoginParams = {
      provider: 'GITHUB',
      providerId: profile.id,
      email,
      firstName: nameParts?.[0],
      lastName: nameParts?.slice(1).join(' ') || undefined,
    };

    done(null, result);
  }
}
