import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Provider } from '@nestjs/common';

import type { Env } from '@/app/config/env.schema.js';

import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthSessionListener } from './auth-session.listener.js';
import { AuthService } from './auth.service.js';
import { GitHubOAuthGuard } from './github-oauth.guard.js';
import { GitHubStrategy } from './github.strategy.js';
import { GoogleOAuthGuard } from './google-oauth.guard.js';
import { GoogleStrategy } from './google.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { LoginLogRepository } from './login-log.repository.js';
import { OAuthStateService } from './oauth-state.service.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { SocialAuthCodeService } from './social-auth-code.service.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { TokenService } from './token.service.js';

function buildSocialStrategyProviders(): Provider[] {
  return [
    {
      provide: 'GOOGLE_STRATEGY',
      useFactory: (configService: ConfigService<Env, true>) => {
        if (configService.get('GOOGLE_CLIENT_ID', { infer: true })) {
          return new GoogleStrategy(configService);
        }

        return null;
      },
      inject: [ConfigService],
    },
    {
      provide: 'GITHUB_STRATEGY',
      useFactory: (configService: ConfigService<Env, true>) => {
        if (configService.get('GITHUB_CLIENT_ID', { infer: true })) {
          return new GitHubStrategy(configService);
        }

        return null;
      },
      inject: [ConfigService],
    },
  ];
}

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256' as const,
          expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
        },
        verifyOptions: {
          algorithms: ['HS256' as const],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    AuthSessionListener,
    JwtStrategy,
    RefreshTokenRepository,
    LoginLogRepository,
    TokenBlacklistService,
    SocialAuthCodeService,
    OAuthStateService,
    GoogleOAuthGuard,
    GitHubOAuthGuard,
    ...buildSocialStrategyProviders(),
  ],
  exports: [AuthService, TokenService, TokenBlacklistService],
})
export class AuthModule {}
