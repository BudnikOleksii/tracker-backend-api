/* eslint-disable no-console */
import { and, eq, isNull } from 'drizzle-orm';

import { transactionCategories } from '../schemas/index.js';
import type { SeedDb } from './client.js';
import type { TransactionData } from './types.js';

type CategoryInsert = typeof transactionCategories.$inferInsert;
type CategorySelect = typeof transactionCategories.$inferSelect;

async function findCategory(
  db: SeedDb,
  { userId, name, parentCategoryId }: { userId: string; name: string; parentCategoryId?: string },
): Promise<CategorySelect | undefined> {
  const conditions = [
    eq(transactionCategories.userId, userId),
    eq(transactionCategories.name, name),
  ];

  if (parentCategoryId) {
    conditions.push(eq(transactionCategories.parentCategoryId, parentCategoryId));
  } else {
    conditions.push(isNull(transactionCategories.parentCategoryId));
  }

  const [result] = await db
    .select()
    .from(transactionCategories)
    .where(and(...conditions))
    .limit(1);

  return result;
}

async function createCategory(
  db: SeedDb,
  params: {
    userId: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    parentCategoryId?: string;
  },
): Promise<CategorySelect> {
  const categoryLevel = params.parentCategoryId ? 'subcategory' : 'category';

  const existing = await findCategory(db, {
    userId: params.userId,
    name: params.name,
    parentCategoryId: params.parentCategoryId,
  });

  if (existing) {
    console.log(`Found existing ${categoryLevel}: ${params.name}`);

    return existing;
  }

  const values: CategoryInsert = {
    userId: params.userId,
    name: params.name,
    type: params.type,
    parentCategoryId: params.parentCategoryId ?? null,
  };

  const [category] = await db.insert(transactionCategories).values(values).returning();

  if (!category) {
    throw new Error(`Failed to insert category: ${params.name}`);
  }

  console.log(`Created ${categoryLevel}: ${params.name} (${params.type})`);

  return category;
}

export async function createCategories(
  db: SeedDb,
  userId: string,
  transactionsData: TransactionData[],
): Promise<{
  createdCategories: Map<string, string>;
  createdSubcategories: Map<string, string>;
}> {
  console.log('Creating categories and subcategories...');

  const categoryMap = new Map<string, { type: 'INCOME' | 'EXPENSE'; subcategories: Set<string> }>();

  transactionsData.forEach((transaction) => {
    const categoryName = transaction.Category;
    const type = transaction.Type === 'Income' ? ('INCOME' as const) : ('EXPENSE' as const);

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, { type, subcategories: new Set() });
    }

    if (transaction.Subcategory) {
      categoryMap.get(categoryName)?.subcategories.add(transaction.Subcategory);
    }
  });

  const createdCategories = new Map<string, string>();
  const createdSubcategories = new Map<string, string>();

  for (const [categoryName, { type, subcategories }] of categoryMap) {
    const category = await createCategory(db, {
      userId,
      name: categoryName,
      type,
    });
    createdCategories.set(categoryName, category.id);

    for (const subcategoryName of subcategories) {
      const subcategory = await createCategory(db, {
        userId,
        name: subcategoryName,
        type,
        parentCategoryId: category.id,
      });
      createdSubcategories.set(subcategoryName, subcategory.id);
    }
  }

  return { createdCategories, createdSubcategories };
}
