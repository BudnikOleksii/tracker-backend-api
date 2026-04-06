import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { transactionTypeEnum } from './enums.js';
import { users } from './users.js';
import { transactions } from './transactions.js';

export const transactionCategories = pgTable(
  'TransactionCategory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: transactionTypeEnum('type').notNull(),
    parentCategoryId: uuid('parentCategoryId').references(
      (): AnyPgColumn => transactionCategories.id,
      { onDelete: 'cascade' },
    ),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deletedAt', { precision: 3, mode: 'date' }),
  },
  (table) => [
    unique('TransactionCategory_userId_name_type_parentCategoryId_key')
      .on(table.userId, table.name, table.type, table.parentCategoryId)
      .nullsNotDistinct(),
    index('TransactionCategory_userId_idx').on(table.userId),
    index('TransactionCategory_parentCategoryId_idx').on(table.parentCategoryId),
    index('TransactionCategory_type_idx').on(table.type),
    unique('TransactionCategory_userId_id_key').on(table.userId, table.id),
  ],
);

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
  user: one(users, {
    fields: [transactionCategories.userId],
    references: [users.id],
  }),
  parentCategory: one(transactionCategories, {
    fields: [transactionCategories.parentCategoryId],
    references: [transactionCategories.id],
    relationName: 'CategoryHierarchy',
  }),
  subcategories: many(transactionCategories, {
    relationName: 'CategoryHierarchy',
  }),
  transactions: many(transactions),
}));
