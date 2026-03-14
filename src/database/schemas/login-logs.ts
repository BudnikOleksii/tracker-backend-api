import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { usersTable } from './users.js'

export const loginStatusEnum = pgEnum('login_status', ['success', 'failed'])

export const loginLogsTable = pgTable(
  'login_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    status: loginStatusEnum('status').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    failReason: text('fail_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('login_logs_user_id_idx').on(table.userId),
    index('login_logs_created_at_idx').on(table.createdAt),
  ],
)

export type LoginLog = typeof loginLogsTable.$inferSelect
export type InsertLoginLog = typeof loginLogsTable.$inferInsert
