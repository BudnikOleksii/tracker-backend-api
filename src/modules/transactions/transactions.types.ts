import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { TransactionType } from '@/shared/enums/transaction-type.enum.js';

export interface ParsedTransactionRow {
  date: Date;
  category: string;
  type: TransactionType;
  amount: string;
  currencyCode: CurrencyCode;
  subcategory?: string;
}

export interface ImportResult {
  transactionsCreated: number;
  categoriesCreated: number;
  subcategoriesCreated: number;
  failedCount: number;
  errors: string[];
}
