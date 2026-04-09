import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import type { Env } from '@/app/config/env.schema.js';

import { OAuthStateService } from './oauth-state.service.js';

@Injectable()
export class GitHubOAuthGuard extends AuthGuard('github') {
  private readonly isConfigured: boolean;

  constructor(
    configService: ConfigService<Env, true>,
    private readonly oauthStateService: OAuthStateService,
  ) {
    super();
    this.isConfigured = !!configService.get('GITHUB_CLIENT_ID', { infer: true });
  }

  override canActivate(context: ExecutionContext) {
    if (!this.isConfigured) {
      throw new HttpException(
        'GitHub authentication is not configured',
        HttpStatus.NOT_IMPLEMENTED,
      );
    }

    const req = context.switchToHttp().getRequest<Request>();
    const isCallback = req.path.endsWith('/callback');

    if (isCallback) {
      const res = context.switchToHttp().getResponse<Response>();
      if (!this.oauthStateService.validateState(req)) {
        this.oauthStateService.clearState(res);
        throw new UnauthorizedException('Invalid OAuth state parameter');
      }
      this.oauthStateService.clearState(res);
    }

    return super.canActivate(context);
  }

  override getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const isCallback = req.path.endsWith('/callback');

    if (!isCallback) {
      const res = context.switchToHttp().getResponse<Response>();
      const state = this.oauthStateService.generateState(res);

      return { state };
    }

    return {};
  }
}
