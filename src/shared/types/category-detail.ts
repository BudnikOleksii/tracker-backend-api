import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export interface CategoryDetail {
  id: string;
  name: string;
  parentCategory: { id: string; name: string } | null;
}

export interface CategoryJoinColumns {
  categoryName: string | null;
  parentCatId: string | null;
  parentCatName: string | null;
}

export interface CategoryValidationInfo {
  id: string;
  type: TransactionType;
}
