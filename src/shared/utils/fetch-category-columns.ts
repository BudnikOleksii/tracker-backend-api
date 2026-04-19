import { aliasedTable, eq } from 'drizzle-orm';

import { transactionCategories } from '@/database/schemas/index.js';
import type { DrizzleDb } from '@/database/types.js';
import type { CategoryJoinColumns } from '@/shared/types/category-detail.js';

const parentCategory = aliasedTable(transactionCategories, 'parentCategory');

export async function fetchCategoryJoinColumns(
  categoryId: string,
  db: DrizzleDb,
): Promise<CategoryJoinColumns> {
  const result = (await db
    .select({
      categoryName: transactionCategories.name,
      parentCatId: parentCategory.id,
      parentCatName: parentCategory.name,
    })
    .from(transactionCategories)
    .leftJoin(parentCategory, eq(transactionCategories.parentCategoryId, parentCategory.id))
    .where(eq(transactionCategories.id, categoryId))
    .limit(1)) as CategoryJoinColumns[];

  const [row] = result;

  return {
    categoryName: row?.categoryName ?? null,
    parentCatId: row?.parentCatId ?? null,
    parentCatName: row?.parentCatName ?? null,
  };
}
