export const PROFILE_EVENTS = {
  PASSWORD_CHANGED: 'profile.password-changed',
  ACCOUNT_DELETED: 'profile.account-deleted',
} as const;

export class ProfileSessionInvalidationEvent {
  readonly userId: string;
  readonly accessTokenJti: string;

  constructor(userId: string, accessTokenJti: string) {
    this.userId = userId;
    this.accessTokenJti = accessTokenJti;
  }
}
