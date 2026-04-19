import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
  private readonly logger = new Logger(GitHubStrategy.name);

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
    accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: (error: Error | null, user?: SocialLoginParams | false) => void,
  ): void {
    // Keep `validate` synchronous to stay compatible with `passport-github2`'s
    // verify-callback contract. Async work is done via `.then`/`.catch` into `done`.
    this.buildSocialLoginParams(accessToken, profile)
      .then((result) => done(null, result))
      .catch((error: unknown) => {
        done(
          error instanceof Error ? error : new UnauthorizedException('GitHub auth failed'),
          false,
        );
      });
  }

  private async buildSocialLoginParams(
    accessToken: string,
    profile: GitHubProfile,
  ): Promise<SocialLoginParams> {
    const apiEmails = await this.fetchUserEmails(accessToken);
    const emails = apiEmails.length > 0 ? apiEmails : (profile.emails ?? []);

    const primaryVerified = emails.find((e) => e.verified === true && e.primary === true);
    const anyVerified = emails.find((e) => e.verified === true);
    const anyEmail = emails[0];

    const picked = primaryVerified ?? anyVerified ?? anyEmail;
    if (!picked) {
      throw new UnauthorizedException('GitHub account has no accessible email');
    }

    const nameParts = profile.displayName?.split(' ');

    return {
      provider: 'GITHUB',
      providerId: profile.id,
      email: picked.value,
      emailVerified: picked.verified === true,
      firstName: nameParts?.[0],
      lastName: nameParts?.slice(1).join(' ') || undefined,
    };
  }

  private async fetchUserEmails(accessToken: string): Promise<GitHubEmail[]> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'tracker-backend-api',
      },
    });

    if (!response.ok) {
      this.logger.warn(
        `GitHub /user/emails returned ${response.status}; falling back to profile emails`,
      );

      return [];
    }

    const data = (await response.json()) as {
      email: string;
      primary: boolean;
      verified: boolean;
    }[];

    return data.map((item) => ({
      value: item.email,
      primary: item.primary,
      verified: item.verified,
    }));
  }
}
