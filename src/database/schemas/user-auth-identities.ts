import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { authProviderEnum } from './enums.js';
import { users } from './users.js';

export const userAuthIdentities = pgTable(
  'UserAuthIdentity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull(),
    providerId: text('providerId'),
    emailAtLink: text('emailAtLink'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('UserAuthIdentity_provider_providerId_unique')
      .on(table.provider, table.providerId)
      .where(sql`${table.providerId} IS NOT NULL`),
    uniqueIndex('UserAuthIdentity_userId_local_unique')
      .on(table.userId, table.provider)
      .where(sql`${table.provider} = 'LOCAL'`),
    index('UserAuthIdentity_userId_createdAt_idx').on(table.userId, table.createdAt),
  ],
);

export type UserAuthIdentity = typeof userAuthIdentities.$inferSelect;
export type InsertUserAuthIdentity = typeof userAuthIdentities.$inferInsert;

export const userAuthIdentitiesRelations = relations(userAuthIdentities, ({ one }) => ({
  user: one(users, {
    fields: [userAuthIdentities.userId],
    references: [users.id],
  }),
}));
