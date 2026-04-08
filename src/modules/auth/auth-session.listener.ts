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
    await this.invalidateSessions(event, 'password change');
  }

  @OnEvent(PROFILE_EVENTS.ACCOUNT_DELETED, { async: true })
  async handleAccountDeleted(event: ProfileSessionInvalidationEvent): Promise<void> {
    await this.invalidateSessions(event, 'account deletion');
  }

  private async invalidateSessions(
    event: ProfileSessionInvalidationEvent,
    reason: string,
  ): Promise<void> {
    const results = await Promise.allSettled([
      this.authService.revokeAllRefreshTokens(event.userId),
      this.authService.blacklistAccessToken(event.accessTokenJti),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(
          `Failed to invalidate sessions after ${reason} for user ${event.userId}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    }
  }
}
