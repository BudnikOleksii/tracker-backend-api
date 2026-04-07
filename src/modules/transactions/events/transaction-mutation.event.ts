export const TRANSACTION_EVENTS = {
  CREATED: 'transaction.created',
  UPDATED: 'transaction.updated',
  DELETED: 'transaction.deleted',
  IMPORTED: 'transaction.imported',
  BULK_PROCESSED: 'transaction.bulk-processed',
} as const;

export type TransactionAction = 'created' | 'updated' | 'deleted' | 'imported' | 'bulk-processed';

export class TransactionMutationEvent {
  readonly userId: string;
  readonly action: TransactionAction;

  constructor(userId: string, action: TransactionAction) {
    this.userId = userId;
    this.action = action;
  }
}
