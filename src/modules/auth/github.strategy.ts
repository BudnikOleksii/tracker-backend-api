import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

import type { Env } from '@/app/config/env.schema.js';

import type { SocialLoginParams } from './auth.types.js';

const GITHUB_EMAILS_TIMEOUT_MS = 3000;

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

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
  ): Promise<SocialLoginParams> {
    return this.buildSocialLoginParams(accessToken, profile);
  }

  private async buildSocialLoginParams(
    accessToken: string,
    profile: GitHubProfile,
  ): Promise<SocialLoginParams> {
    const apiEmails = await this.fetchUserEmails(accessToken);
    const emails = apiEmails.length > 0 ? apiEmails : (profile.emails ?? []);

    // Per spec: only a PRIMARY verified email counts as "verified by provider".
    // Secondary verified emails fall back to the un-verified path so the service
    // rejects with EMAIL_UNVERIFIED_PROVIDER instead of auto-linking.
    const primaryVerified = emails.find((e) => e.verified === true && e.primary === true);
    const fallback = emails[0];

    const picked = primaryVerified ?? fallback;
    if (!picked) {
      throw new UnauthorizedException('GitHub account has no accessible email');
    }

    const nameParts = profile.displayName?.split(' ');

    return {
      provider: 'GITHUB',
      providerId: profile.id,
      email: picked.value,
      emailVerified: picked === primaryVerified,
      firstName: nameParts?.[0],
      lastName: nameParts?.slice(1).join(' ') || undefined,
    };
  }

  private async fetchUserEmails(accessToken: string): Promise<GitHubEmail[]> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), GITHUB_EMAILS_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.github.com/user/emails', {
        signal: abortController.signal,
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
    } catch (error) {
      this.logger.warn(
        `GitHub /user/emails request failed (${error instanceof Error ? error.message : 'unknown error'}); falling back to profile emails`,
      );

      return [];
    } finally {
      clearTimeout(timeout);
    }
  }
}
