import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { userAuthIdentities, users } from '@/database/schemas/index.js';
import type { UserAuthIdentity } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';
import type { UserIdentity } from '@/shared/types/user-identity.js';

export interface CreateIdentityData {
  userId: string;
  provider: AuthProvider;
  providerId: string | null;
  emailAtLink?: string | null;
}

export interface IdentityTokenUser extends UserIdentity {
  emailVerified: boolean;
}

export interface IdentityWithUser {
  identity: UserAuthIdentity;
  user: IdentityTokenUser;
}

type IdentityExecutor = Pick<DrizzleDb, 'insert' | 'select'>;

@Injectable()
export class IdentityRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findByProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<IdentityWithUser | null> {
    const result = await this.db
      .select({
        identity: userAuthIdentities,
        user: {
          id: users.id,
          email: users.email,
          role: users.role,
          emailVerified: users.emailVerified,
        },
      })
      .from(userAuthIdentities)
      .innerJoin(users, eq(users.id, userAuthIdentities.userId))
      .where(
        and(
          eq(userAuthIdentities.provider, provider),
          eq(userAuthIdentities.providerId, providerId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findByUserId(userId: string): Promise<UserAuthIdentity[]> {
    return this.db
      .select()
      .from(userAuthIdentities)
      .where(eq(userAuthIdentities.userId, userId))
      .orderBy(asc(userAuthIdentities.createdAt));
  }

  async create(data: CreateIdentityData, tx?: IdentityExecutor): Promise<UserAuthIdentity> {
    const executor = tx ?? this.db;

    const [row] = await executor
      .insert(userAuthIdentities)
      .values({
        userId: data.userId,
        provider: data.provider,
        providerId: data.providerId,
        emailAtLink: data.emailAtLink ?? null,
      })
      .returning();

    if (!row) {
      throw new Error('Insert did not return a row');
    }

    return row;
  }

  async hasLocalIdentity(userId: string): Promise<boolean> {
    const result = await this.db
      .select({ exists: sql<number>`1` })
      .from(userAuthIdentities)
      .where(and(eq(userAuthIdentities.userId, userId), eq(userAuthIdentities.provider, 'LOCAL')))
      .limit(1);

    return result.length > 0;
  }
}
