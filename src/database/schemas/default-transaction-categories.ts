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

export const defaultTransactionCategories = pgTable(
  'DefaultTransactionCategory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: transactionTypeEnum('type').notNull(),
    parentDefaultTransactionCategoryId: uuid('parentDefaultTransactionCategoryId').references(
      (): AnyPgColumn => defaultTransactionCategories.id,
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
    unique('DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key')
      .on(table.name, table.type, table.parentDefaultTransactionCategoryId)
      .nullsNotDistinct(),
    index('DefaultTransactionCategory_type_idx').on(table.type),
    index('DefaultTransactionCategory_parentDefaultTransactionCategoryId_idx').on(
      table.parentDefaultTransactionCategoryId,
    ),
  ],
);

export const defaultTransactionCategoriesRelations = relations(
  defaultTransactionCategories,
  ({ one, many }) => ({
    parentDefaultTransactionCategory: one(defaultTransactionCategories, {
      fields: [defaultTransactionCategories.parentDefaultTransactionCategoryId],
      references: [defaultTransactionCategories.id],
      relationName: 'DefaultCategoryHierarchy',
    }),
    subcategories: many(defaultTransactionCategories, {
      relationName: 'DefaultCategoryHierarchy',
    }),
  }),
);
