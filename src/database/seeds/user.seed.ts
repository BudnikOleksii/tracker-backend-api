/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';

import { userAuthIdentities, users } from '../schemas/index.js';
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
    await ensureLocalIdentity(db, existingUser.id, existingUser.email);

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

  await ensureLocalIdentity(db, user.id, user.email);

  console.log(`Created SUPER_ADMIN user: ${user.email}`);

  return user;
}

async function ensureLocalIdentity(db: SeedDb, userId: string, email: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(userAuthIdentities)
    .where(and(eq(userAuthIdentities.userId, userId), eq(userAuthIdentities.provider, 'LOCAL')))
    .limit(1);

  if (existing) {
    return;
  }

  await db.insert(userAuthIdentities).values({
    userId,
    provider: 'LOCAL',
    providerId: null,
    emailAtLink: email,
  });
}
