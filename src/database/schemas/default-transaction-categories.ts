import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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
    uniqueIndex('DefaultTransactionCategory_name_type_parentDefaultTransactionCategoryId_key')
      .on(table.name, table.type, table.parentDefaultTransactionCategoryId)
      .where(sql`"deletedAt" IS NULL`),
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
