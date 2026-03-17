import {
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import {
  currencyCodeEnum,
  recurringFrequencyEnum,
  recurringTransactionStatusEnum,
  transactionTypeEnum,
} from './enums.js';
import { users } from './users.js';
import { transactionCategories } from './transaction-categories.js';
import { transactions } from './transactions.js';

export const recurringTransactions = pgTable(
  'RecurringTransaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('categoryId').notNull(),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 19, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currencyCode').notNull(),
    description: text('description'),
    frequency: recurringFrequencyEnum('frequency').notNull(),
    interval: integer('interval').notNull().default(1),
    startDate: timestamp('startDate', { precision: 3, mode: 'date' }).notNull(),
    endDate: timestamp('endDate', { precision: 3, mode: 'date' }),
    nextOccurrenceDate: timestamp('nextOccurrenceDate', { precision: 3, mode: 'date' }).notNull(),
    status: recurringTransactionStatusEnum('status').notNull().default('ACTIVE'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check('RecurringTransaction_interval_gt_0_chk', sql`${table.interval} > 0`),
    index('RecurringTransaction_userId_idx').on(table.userId),
    index('RecurringTransaction_categoryId_idx').on(table.categoryId),
    index('RecurringTransaction_status_idx').on(table.status),
    index('RecurringTransaction_nextOccurrenceDate_idx').on(table.nextOccurrenceDate),
    index('RecurringTransaction_type_idx').on(table.type),
    foreignKey({
      columns: [table.userId, table.categoryId],
      foreignColumns: [transactionCategories.userId, transactionCategories.id],
    }).onDelete('restrict'),
  ],
);

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  user: one(users, {
    fields: [recurringTransactions.userId],
    references: [users.id],
  }),
  category: one(transactionCategories, {
    fields: [recurringTransactions.categoryId],
    references: [transactionCategories.id],
  }),
  transactions: many(transactions),
}));
