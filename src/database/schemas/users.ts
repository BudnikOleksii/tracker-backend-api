import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { authProviderEnum, countryCodeEnum, currencyCodeEnum, userRoleEnum } from './enums.js';
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
    }),
    countryCode: countryCodeEnum('countryCode'),
    baseCurrencyCode: currencyCodeEnum('baseCurrencyCode'),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    onboardingCompleted: boolean('onboardingCompleted').notNull().default(false),
    role: userRoleEnum('role').notNull().default('USER'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('User_authProvider_authProviderId_unique')
      .on(table.authProvider, table.authProviderId)
      .where(sql`${table.authProviderId} IS NOT NULL`),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  transactionCategories: many(transactionCategories),
  transactions: many(transactions),
}));
