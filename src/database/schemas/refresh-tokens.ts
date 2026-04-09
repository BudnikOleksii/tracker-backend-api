import { type AnyPgColumn, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { users } from './users.js';

export const refreshTokens = pgTable(
  'RefreshToken',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    deviceInfo: text('deviceInfo'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    expiresAt: timestamp('expiresAt', {
      precision: 3,
      mode: 'date',
    }).notNull(),
    replacedByTokenId: uuid('replacedByTokenId')
      .references((): AnyPgColumn => refreshTokens.id, { onDelete: 'set null' })
      .unique(),
    revokedAt: timestamp('revokedAt', { precision: 3, mode: 'date' }),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('RefreshToken_userId_idx').on(table.userId),
    index('RefreshToken_expiresAt_idx').on(table.expiresAt),
  ],
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
  replacedByToken: one(refreshTokens, {
    fields: [refreshTokens.replacedByTokenId],
    references: [refreshTokens.id],
    relationName: 'ReplacedBy',
  }),
  replacedToken: one(refreshTokens, {
    fields: [refreshTokens.id],
    references: [refreshTokens.replacedByTokenId],
    relationName: 'ReplacedBy',
  }),
}));
