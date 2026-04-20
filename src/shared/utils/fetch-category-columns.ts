import { eq } from 'drizzle-orm';

import { transactionCategories } from '@/database/schemas/index.js';
import type { DrizzleDb } from '@/database/types.js';
import type { CategoryJoinColumns } from '@/shared/types/category-detail.js';

export async function fetchCategoryJoinColumns(
  categoryId: string,
  db: DrizzleDb,
): Promise<CategoryJoinColumns> {
  const [category] = await db
    .select({
      name: transactionCategories.name,
      parentCategoryId: transactionCategories.parentCategoryId,
    })
    .from(transactionCategories)
    .where(eq(transactionCategories.id, categoryId))
    .limit(1);

  if (!category) {
    return { categoryName: null, parentCatId: null, parentCatName: null };
  }

  if (!category.parentCategoryId) {
    return { categoryName: category.name, parentCatId: null, parentCatName: null };
  }

  const [parent] = await db
    .select({ name: transactionCategories.name })
    .from(transactionCategories)
    .where(eq(transactionCategories.id, category.parentCategoryId))
    .limit(1);

  return {
    categoryName: category.name,
    parentCatId: category.parentCategoryId,
    parentCatName: parent?.name ?? null,
  };
}
