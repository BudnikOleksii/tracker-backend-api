import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import type { Env } from '@/app/config/env.schema.js';

import { DefaultTransactionCategoriesModule } from '../default-transaction-categories/default-transaction-categories.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { LoginLogRepository } from './login-log.repository.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';

@Module({
  imports: [
    DefaultTransactionCategoriesModule,
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenRepository, LoginLogRepository],
  exports: [AuthService, RefreshTokenRepository],
})
export class AuthModule {}
