export const USER_EVENTS = {
  HARD_DELETED: 'user.hard-deleted',
} as const;

export class UserHardDeletedEvent {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
