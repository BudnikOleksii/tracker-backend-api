import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  PROFILE_EVENTS,
  type ProfileSessionInvalidationEvent,
} from '@/modules/profile/events/profile.event.js';

import { AuthService } from './auth.service.js';

@Injectable()
export class AuthSessionListener {
  private readonly logger = new Logger(AuthSessionListener.name);

  constructor(private readonly authService: AuthService) {}

  @OnEvent(PROFILE_EVENTS.PASSWORD_CHANGED, { async: true })
  async handlePasswordChanged(event: ProfileSessionInvalidationEvent): Promise<void> {
    try {
      await this.authService.revokeAllRefreshTokens(event.userId);
      await this.authService.blacklistAccessToken(event.accessTokenJti);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate sessions after password change for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(PROFILE_EVENTS.ACCOUNT_DELETED, { async: true })
  async handleAccountDeleted(event: ProfileSessionInvalidationEvent): Promise<void> {
    try {
      await this.authService.revokeAllRefreshTokens(event.userId);
      await this.authService.blacklistAccessToken(event.accessTokenJti);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate sessions after account deletion for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
