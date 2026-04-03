/* eslint-disable no-console */
import { and, eq, isNull } from 'drizzle-orm';

import { defaultTransactionCategories } from '../schemas/index.js';
import type { SeedDb } from './client.js';

type DefaultCategoryInsert = typeof defaultTransactionCategories.$inferInsert;
type DefaultCategorySelect = typeof defaultTransactionCategories.$inferSelect;

interface DefaultCategoryDefinition {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  subcategories?: string[];
}

const DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = [
  // Income
  { name: 'Allowance', type: 'INCOME' },
  { name: 'Salary', type: 'INCOME' },
  { name: 'Petty cash', type: 'INCOME' },
  { name: 'Bonus', type: 'INCOME' },
  { name: 'Other', type: 'INCOME' },

  // Expenses
  {
    name: 'Food',
    type: 'EXPENSE',
    subcategories: ['Groceries', 'Eating out', 'Beverages'],
  },
  {
    name: 'Social Life',
    type: 'EXPENSE',
    subcategories: ['Friends', 'Fellowship', 'Alumni', 'Dues'],
  },
  { name: 'Pets', type: 'EXPENSE' },
  {
    name: 'Transport',
    type: 'EXPENSE',
    subcategories: ['Bus', 'Subway', 'Taxi', 'Car'],
  },
  {
    name: 'Culture',
    type: 'EXPENSE',
    subcategories: ['Books', 'Movie', 'Music', 'Apps'],
  },
  {
    name: 'General',
    type: 'EXPENSE',
    subcategories: ['Rent', 'Utilities'],
  },
  {
    name: 'Household',
    type: 'EXPENSE',
    subcategories: ['Appliances', 'Furniture', 'Kitchen', 'Toiletries', 'Chandlery'],
  },
  {
    name: 'Apparel',
    type: 'EXPENSE',
    subcategories: ['Clothing', 'Fashion', 'Shoes', 'Laundry'],
  },
  {
    name: 'Beauty',
    type: 'EXPENSE',
    subcategories: ['Cosmetics', 'Makeup', 'Accessories', 'Other'],
  },
  {
    name: 'Health',
    type: 'EXPENSE',
    subcategories: ['Medicine', 'Hospital', 'Other'],
  },
  {
    name: 'Education',
    type: 'EXPENSE',
    subcategories: ['Courses', 'Academy', 'Conferences', 'School supplies'],
  },
  {
    name: 'Gifts',
    type: 'EXPENSE',
    subcategories: ['Birthdays', 'Holidays'],
  },
  { name: 'Other', type: 'EXPENSE' },
];

async function findDefaultCategory(
  db: SeedDb,
  { name, type, parentId }: { name: string; type: 'INCOME' | 'EXPENSE'; parentId?: string },
): Promise<DefaultCategorySelect | undefined> {
  const conditions = [
    eq(defaultTransactionCategories.name, name),
    eq(defaultTransactionCategories.type, type),
    isNull(defaultTransactionCategories.deletedAt),
  ];

  if (parentId) {
    conditions.push(eq(defaultTransactionCategories.parentDefaultTransactionCategoryId, parentId));
  } else {
    conditions.push(isNull(defaultTransactionCategories.parentDefaultTransactionCategoryId));
  }

  const [result] = await db
    .select()
    .from(defaultTransactionCategories)
    .where(and(...conditions))
    .limit(1);

  return result;
}

async function createDefaultCategory(
  db: SeedDb,
  params: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    parentDefaultTransactionCategoryId?: string;
  },
): Promise<DefaultCategorySelect> {
  const categoryLevel = params.parentDefaultTransactionCategoryId ? 'subcategory' : 'category';

  const existing = await findDefaultCategory(db, {
    name: params.name,
    type: params.type,
    parentId: params.parentDefaultTransactionCategoryId,
  });

  if (existing) {
    console.log(`Found existing default ${categoryLevel}: ${params.name}`);

    return existing;
  }

  const values: DefaultCategoryInsert = {
    name: params.name,
    type: params.type,
    parentDefaultTransactionCategoryId: params.parentDefaultTransactionCategoryId ?? null,
  };

  const [category] = await db.insert(defaultTransactionCategories).values(values).returning();

  if (!category) {
    throw new Error(`Failed to insert default category: ${params.name}`);
  }

  console.log(`Created default ${categoryLevel}: ${params.name} (${params.type})`);

  return category;
}

export async function seedDefaultTransactionCategories(db: SeedDb): Promise<void> {
  console.log('Seeding default transaction categories...');

  for (const definition of DEFAULT_CATEGORIES) {
    const parent = await createDefaultCategory(db, {
      name: definition.name,
      type: definition.type,
    });

    if (definition.subcategories) {
      for (const subcategoryName of definition.subcategories) {
        await createDefaultCategory(db, {
          name: subcategoryName,
          type: definition.type,
          parentDefaultTransactionCategoryId: parent.id,
        });
      }
    }
  }

  console.log('Default transaction categories seeded successfully!');
}
