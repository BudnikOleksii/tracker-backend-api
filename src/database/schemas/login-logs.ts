import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const loginStatusEnum = pgEnum('LoginStatus', ['success', 'failed']);

export const loginLogs = pgTable(
  'LoginLog',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    status: loginStatusEnum('status').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    failReason: text('failReason'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('LoginLog_userId_idx').on(table.userId),
    index('LoginLog_createdAt_idx').on(table.createdAt),
  ],
);
