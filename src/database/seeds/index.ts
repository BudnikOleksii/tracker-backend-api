/* eslint-disable no-console */
import { count } from 'drizzle-orm';

import { users, transactions, transactionCategories } from '../schemas/index.js';
import { createSeedClient } from './client.js';
import { loadTransactionData } from './data-loader.js';
import { createSuperAdminUser } from './user.seed.js';
import { createCategories } from './category.seed.js';
import { createTransactions } from './transaction.seed.js';

async function seedDatabase(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const { db, pool } = createSeedClient(connectionString);

  try {
    console.log('Starting database seeding...');

    console.log('Loading transaction data...');
    const transactionsData = loadTransactionData();
    console.log(`Loaded ${transactionsData.length} transactions`);

    const user = await createSuperAdminUser(db);

    const { createdCategories, createdSubcategories } = await createCategories(
      db,
      user.id,
      transactionsData,
    );

    await createTransactions(db, {
      userId: user.id,
      transactionsData,
      categories: createdCategories,
      subcategories: createdSubcategories,
    });

    console.log('Database seeding completed successfully!');

    const [userCount] = await db.select({ count: count() }).from(users);
    const [categoryCount] = await db.select({ count: count() }).from(transactionCategories);
    const [transactionCount] = await db.select({ count: count() }).from(transactions);

    console.log('\nDatabase Summary:');
    console.log(`Users: ${String(userCount?.count)}`);
    console.log(`Categories: ${String(categoryCount?.count)}`);
    console.log(`Transactions: ${String(transactionCount?.count)}`);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

void seedDatabase();
