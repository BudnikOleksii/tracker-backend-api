import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  PROFILE_EVENTS,
  type ProfileSessionInvalidationEvent,
} from '@/modules/profile/events/profile.event.js';
import { USER_EVENTS, type UserHardDeletedEvent } from '@/modules/user/events/user.event.js';

import { TokenService } from './token.service.js';

@Injectable()
export class AuthSessionListener {
  private readonly logger = new Logger(AuthSessionListener.name);

  constructor(private readonly tokenService: TokenService) {}

  @OnEvent(PROFILE_EVENTS.PASSWORD_CHANGED, { async: true })
  async handlePasswordChanged(event: ProfileSessionInvalidationEvent): Promise<void> {
    await this.invalidateSessions(event, 'password change');
  }

  @OnEvent(PROFILE_EVENTS.ACCOUNT_DELETED, { async: true })
  async handleAccountDeleted(event: ProfileSessionInvalidationEvent): Promise<void> {
    await this.invalidateSessions(event, 'account deletion');
  }

  @OnEvent(USER_EVENTS.HARD_DELETED, { async: true })
  async handleUserHardDeleted(event: UserHardDeletedEvent): Promise<void> {
    // Admin-triggered hard delete: we only know the target userId, not any
    // active access-token JTI, so we can only revoke refresh tokens here.
    // Access tokens expire naturally; the cascade FK deletes refresh tokens
    // too, but the explicit call documents intent and survives schema changes.
    try {
      await this.tokenService.revokeAllRefreshTokens(event.userId);
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh tokens after hard delete for user ${event.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async invalidateSessions(
    event: ProfileSessionInvalidationEvent,
    reason: string,
  ): Promise<void> {
    const results = await Promise.allSettled([
      this.tokenService.revokeAllRefreshTokens(event.userId),
      this.tokenService.blacklistAccessToken(event.accessTokenJti),
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
