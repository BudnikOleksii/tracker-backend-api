import {
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

import { currencyCodeEnum, transactionTypeEnum } from './enums.js';
import { users } from './users.js';
import { transactionCategories } from './transaction-categories.js';
import { recurringTransactions } from './recurring-transactions.js';

export const transactions = pgTable(
  'Transaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('categoryId').notNull(),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 19, scale: 2 }).notNull(),
    currencyCode: currencyCodeEnum('currencyCode').notNull(),
    date: timestamp('date', { precision: 3, mode: 'date' }).notNull(),
    description: text('description'),
    recurringTransactionId: uuid('recurringTransactionId').references(
      () => recurringTransactions.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('Transaction_userId_idx').on(table.userId),
    index('Transaction_categoryId_idx').on(table.categoryId),
    index('Transaction_date_idx').on(table.date),
    index('Transaction_type_idx').on(table.type),
    index('Transaction_currencyCode_idx').on(table.currencyCode),
    index('Transaction_recurringTransactionId_idx').on(table.recurringTransactionId),
    index('Transaction_userId_date_idx').on(table.userId, table.date.desc()),
    index('Transaction_userId_currencyCode_date_idx').on(
      table.userId,
      table.currencyCode,
      table.date.desc(),
    ),
    foreignKey({
      columns: [table.userId, table.categoryId],
      foreignColumns: [transactionCategories.userId, transactionCategories.id],
    }).onDelete('restrict'),
    check('Transaction_amount_positive', sql`amount > 0`),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(transactionCategories, {
    fields: [transactions.categoryId],
    references: [transactionCategories.id],
  }),
  recurringTransaction: one(recurringTransactions, {
    fields: [transactions.recurringTransactionId],
    references: [recurringTransactions.id],
  }),
}));
