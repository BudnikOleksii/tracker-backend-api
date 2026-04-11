/* eslint-disable no-console */
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';

import { transactions } from '../schemas/index.js';
import type { SeedDb } from './client.js';
import type { TransactionData } from './types.js';

const BATCH_SIZE = 100;

export async function createTransactions(
  db: SeedDb,
  {
    userId,
    transactionsData,
    categories,
    subcategories,
  }: {
    userId: string;
    transactionsData: TransactionData[];
    categories: Map<string, string>;
    subcategories: Map<string, string>;
  },
): Promise<void> {
  console.log('Creating transactions...');

  let createdCount = 0;

  for (let i = 0; i < transactionsData.length; i += BATCH_SIZE) {
    const batch = transactionsData.slice(i, i + BATCH_SIZE);

    const transactionValues = batch.map((transaction) => {
      const categoryId = categories.get(transaction.Category);
      const subcategoryId = transaction.Subcategory
        ? subcategories.get(transaction.Subcategory)
        : undefined;

      if (!categoryId) {
        throw new Error(`Category not found: ${transaction.Category}`);
      }

      return {
        amount: transaction.Amount.toString(),
        date: new Date(transaction.Date),
        description: `${transaction.Category}${transaction.Subcategory ? ` - ${transaction.Subcategory}` : ''}`,
        currencyCode: transaction.Currency as CurrencyCode,
        type: transaction.Type === 'Income' ? 'INCOME' : 'EXPENSE',
        userId,
        categoryId: subcategoryId ?? categoryId,
      } as const;
    });

    await db.insert(transactions).values(transactionValues);

    createdCount += transactionValues.length;
    console.log(`Processed ${createdCount}/${transactionsData.length} transactions...`);
  }

  console.log(`Created ${createdCount} transactions`);
}
