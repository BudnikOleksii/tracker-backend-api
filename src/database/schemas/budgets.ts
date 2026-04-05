import { index, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { budgetPeriodEnum, budgetStatusEnum, currencyCodeEnum } from './enums.js';
import { users } from './users.js';
import { transactionCategories } from './transaction-categories.js';

export const budgets = pgTable(
  'Budget',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('categoryId').references(() => transactionCategories.id, {
      onDelete: 'set null',
    }),
    amount: numeric('amount', { precision: 19, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currencyCode').notNull(),
    period: budgetPeriodEnum('period').notNull(),
    startDate: timestamp('startDate', { precision: 3, mode: 'date' }).notNull(),
    endDate: timestamp('endDate', { precision: 3, mode: 'date' }).notNull(),
    status: budgetStatusEnum('status').notNull().default('ACTIVE'),
    description: text('description'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('Budget_userId_idx').on(table.userId),
    index('Budget_categoryId_idx').on(table.categoryId),
    index('Budget_status_idx').on(table.status),
    index('Budget_startDate_endDate_idx').on(table.startDate, table.endDate),
    index('Budget_status_endDate_idx')
      .on(table.status, table.endDate)
      .where(sql`status IN ('ACTIVE', 'EXCEEDED')`),
  ],
);

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(transactionCategories, {
    fields: [budgets.categoryId],
    references: [transactionCategories.id],
  }),
}));
