/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

import { users } from '../schemas/index.js';
import type { SeedDb } from './client.js';

export async function createSuperAdminUser(db: SeedDb): Promise<typeof users.$inferSelect> {
  console.log('Creating SUPER_ADMIN user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@trackmymoney.com'))
    .limit(1);

  if (existingUser) {
    console.log(`Found existing SUPER_ADMIN user: ${existingUser.email}`);

    return existingUser;
  }

  const [user] = await db
    .insert(users)
    .values({
      email: 'admin@trackmymoney.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      emailVerified: true,
      countryCode: 'UA',
      baseCurrencyCode: 'UAH',
    })
    .returning();

  if (!user) {
    throw new Error('Failed to create SUPER_ADMIN user');
  }

  console.log(`Created SUPER_ADMIN user: ${user.email}`);

  return user;
}
