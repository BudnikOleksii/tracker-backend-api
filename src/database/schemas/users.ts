import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { countryCodeEnum, currencyCodeEnum, userRoleEnum } from './enums.js';
import { refreshTokens } from './refresh-tokens.js';
import { transactionCategories } from './transaction-categories.js';
import { transactions } from './transactions.js';

export const users = pgTable(
  'User',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('passwordHash').notNull(),
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
  (table) => [index('User_email_idx').on(table.email)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  transactionCategories: many(transactionCategories),
  transactions: many(transactions),
}));
