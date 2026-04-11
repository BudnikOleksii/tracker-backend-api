import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import type { CountryCode, CurrencyCode } from './enums.js';
import { authProviderEnum, userRoleEnum } from './enums.js';
import { refreshTokens } from './refresh-tokens.js';
import { transactionCategories } from './transaction-categories.js';
import { transactions } from './transactions.js';

export const users = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('passwordHash'),
    authProvider: authProviderEnum('authProvider').notNull().default('LOCAL'),
    authProviderId: text('authProviderId'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    emailVerified: boolean('emailVerified').notNull().default(false),
    emailVerificationToken: text('emailVerificationToken'),
    emailVerificationTokenExpiresAt: timestamp('emailVerificationTokenExpiresAt', {
      precision: 3,
      mode: 'date',
      withTimezone: true,
    }),
    countryCode: varchar('countryCode', { length: 3 }).$type<CountryCode>(),
    baseCurrencyCode: varchar('baseCurrencyCode', { length: 3 }).$type<CurrencyCode>(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    onboardingCompleted: boolean('onboardingCompleted').notNull().default(false),
    role: userRoleEnum('role').notNull().default('USER'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'date', withTimezone: true }),
  },
  (table) => [
    uniqueIndex('User_authProvider_authProviderId_unique')
      .on(table.authProvider, table.authProviderId)
      .where(sql`${table.authProviderId} IS NOT NULL`),
    index('User_emailVerificationToken_idx')
      .on(table.emailVerificationToken)
      .where(sql`${table.emailVerificationToken} IS NOT NULL`),
    index('User_id_not_deleted_idx')
      .on(table.id)
      .where(sql`"deletedAt" IS NULL`),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  transactionCategories: many(transactionCategories),
  transactions: many(transactions),
}));
