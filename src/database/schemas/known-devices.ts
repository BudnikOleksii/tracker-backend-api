import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { users } from './users.js';

export const knownDevices = pgTable(
  'KnownDevice',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ipAddress: text('ipAddress').notNull(),
    userAgent: text('userAgent').notNull(),
    firstSeenAt: timestamp('firstSeenAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    lastSeenAt: timestamp('lastSeenAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('KnownDevice_userId_ipAddress_userAgent_unique').on(
      table.userId,
      table.ipAddress,
      table.userAgent,
    ),
  ],
);

export const knownDevicesRelations = relations(knownDevices, ({ one }) => ({
  user: one(users, {
    fields: [knownDevices.userId],
    references: [users.id],
  }),
}));
