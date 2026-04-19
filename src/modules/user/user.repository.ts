import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { userAuthIdentities, users } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { User } from '@/database/schemas/index.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import type { CountryCode } from '@/shared/enums/country-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';
import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';

import { IdentityRepository } from './identity.repository.js';
import type { SortByField } from './user.constants.js';

export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider | null;
  emailVerified: boolean;
  countryCode: CountryCode | null;
  baseCurrencyCode: CurrencyCode | null;
  onboardingCompleted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  countryCode: CountryCode | null;
  baseCurrencyCode: CurrencyCode | null;
  onboardingCompleted: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  countryCode?: CountryCode;
  baseCurrencyCode?: CurrencyCode;
  onboardingCompleted?: boolean;
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
}

export interface UserListResult {
  data: UserInfo[];
  total: number;
}

export interface CreateUserData {
  email: string;
  passwordHash?: string | null;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  identity?: {
    provider: AuthProvider;
    providerId: string | null;
    emailAtLink?: string | null;
  };
}

export interface UpdateUserData {
  role?: UserRole;
}

export interface UserSummary {
  total: number;
  adminCount: number;
  newToday: number;
}

// Derives the user's displayed auth provider from the identity table:
// LOCAL wins if present; otherwise the earliest-created social identity.
// Returns NULL when a user has zero identities — a data-integrity violation
// that callers should surface rather than paper over with a LOCAL default.
const DERIVED_AUTH_PROVIDER = sql<AuthProvider | null>`(
  CASE
    WHEN EXISTS (
      SELECT 1 FROM ${userAuthIdentities}
      WHERE ${userAuthIdentities.userId} = ${users.id}
        AND ${userAuthIdentities.provider} = 'LOCAL'
    ) THEN 'LOCAL'::"AuthProvider"
    ELSE (
      SELECT ${userAuthIdentities.provider} FROM ${userAuthIdentities}
      WHERE ${userAuthIdentities.userId} = ${users.id}
      ORDER BY ${userAuthIdentities.createdAt} ASC
      LIMIT 1
    )
  END
)`;

const USER_INFO_COLUMNS = {
  id: users.id,
  email: users.email,
  role: users.role,
  authProvider: DERIVED_AUTH_PROVIDER,
  emailVerified: users.emailVerified,
  countryCode: users.countryCode,
  baseCurrencyCode: users.baseCurrencyCode,
  onboardingCompleted: users.onboardingCompleted,
  ipAddress: users.ipAddress,
  userAgent: users.userAgent,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

const SORT_COLUMN_MAP = {
  email: users.email,
  createdAt: users.createdAt,
} as const;

interface UserInfoRow {
  id: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider | null;
  emailVerified: boolean;
  countryCode: CountryCode | null;
  baseCurrencyCode: CurrencyCode | null;
  onboardingCompleted: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    private readonly identityRepository: IdentityRepository,
  ) {}

  async findAll(query: UserListQuery): Promise<UserListResult> {
    const { page, pageSize, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const conditions: SQL[] = [];
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      const escapedSearch = normalizedSearch.replace(/[\\%_]/g, '\\$&');
      conditions.push(ilike(users.email, `%${escapedSearch}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [usersData, totalResult] = await Promise.all([
      this.db
        .select(USER_INFO_COLUMNS)
        .from(users)
        .where(whereClause)
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy(sortDirection(sortColumn)),
      this.db.select({ count: count() }).from(users).where(whereClause),
    ]);

    const data: UserInfo[] = usersData.map((user) => this.toUserInfo(user));

    return {
      data,
      total: totalResult[0]?.count ?? 0,
    };
  }

  async findById(id: string): Promise<UserInfo | null> {
    const result = await this.db
      .select(USER_INFO_COLUMNS)
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toUserInfo(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)));

    return (result[0]?.count ?? 0) > 0;
  }

  async create(data: CreateUserData): Promise<UserInfo> {
    const insertUserId = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash ?? null,
          role: data.role ?? 'USER',
          firstName: data.firstName,
          lastName: data.lastName,
          emailVerified: data.emailVerified ?? false,
        })
        .returning({ id: users.id });

      const [row] = inserted;
      if (!row) {
        throw new Error('Insert did not return a row');
      }

      if (data.identity) {
        await this.identityRepository.create(
          {
            userId: row.id,
            provider: data.identity.provider,
            providerId: data.identity.providerId,
            emailAtLink: data.identity.emailAtLink ?? data.email.toLowerCase(),
          },
          tx,
        );
      }

      return row.id;
    });

    const created = await this.findById(insertUserId);
    if (!created) {
      throw new Error('Failed to load created user');
    }

    return created;
  }

  async updatePasswordHashWithLocalIdentity(id: string, passwordHash: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));

      const existing = await tx
        .select({ id: userAuthIdentities.id })
        .from(userAuthIdentities)
        .where(and(eq(userAuthIdentities.userId, id), eq(userAuthIdentities.provider, 'LOCAL')))
        .limit(1);

      if (existing.length === 0) {
        await this.identityRepository.create(
          { userId: id, provider: 'LOCAL', providerId: null },
          tx,
        );
      }
    });
  }

  async update(id: string, data: UpdateUserData): Promise<UserInfo | null> {
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (data.role !== undefined) {
      updates.role = data.role;
    }

    const result = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (result.length === 0) {
      return null;
    }

    return this.findById(id);
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));

    return (result.rowCount ?? 0) > 0;
  }

  async getSummary(): Promise<UserSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, adminResult, newTodayResult] = await Promise.all([
      this.db.select({ count: count() }).from(users),
      this.db.select({ count: count() }).from(users).where(eq(users.role, 'ADMIN')),
      this.db.select({ count: count() }).from(users).where(gte(users.createdAt, today)),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      adminCount: adminResult[0]?.count ?? 0,
      newToday: newTodayResult[0]?.count ?? 0,
    };
  }

  async findFullById(
    id: string,
  ): Promise<
    Pick<
      User,
      'id' | 'email' | 'emailVerified' | 'passwordHash' | 'baseCurrencyCode' | 'onboardingCompleted'
    >
  > {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
        passwordHash: users.passwordHash,
        baseCurrencyCode: users.baseCurrencyCode,
        onboardingCompleted: users.onboardingCompleted,
      })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    const user = result[0];
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }

  async findProfileById(id: string): Promise<ProfileInfo | null> {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        countryCode: users.countryCode,
        baseCurrencyCode: users.baseCurrencyCode,
        onboardingCompleted: users.onboardingCompleted,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toProfileInfo(row);
  }

  async findWithPasswordHash(
    id: string,
  ): Promise<{ id: string; passwordHash: string | null } | null> {
    const result = await this.db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async updateProfile(id: string, data: UpdateProfileData): Promise<ProfileInfo | null> {
    const updates: Partial<typeof users.$inferInsert> = {};

    if (data.firstName !== undefined) {
      updates.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updates.lastName = data.lastName;
    }
    if (data.countryCode !== undefined) {
      updates.countryCode = data.countryCode;
    }
    if (data.baseCurrencyCode !== undefined) {
      updates.baseCurrencyCode = data.baseCurrencyCode;
    }
    if (data.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = data.onboardingCompleted;
    }

    if (Object.keys(updates).length === 0) {
      return this.findProfileById(id);
    }

    updates.updatedAt = new Date();

    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();

    const [row] = result;
    if (!row) {
      return null;
    }

    return this.toProfileInfo(row);
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: true; userId: string } | { success: false; reason: string }> {
    const result = await this.db
      .select({
        id: users.id,
        emailVerified: users.emailVerified,
        emailVerificationTokenExpiresAt: users.emailVerificationTokenExpiresAt,
      })
      .from(users)
      .where(and(eq(users.emailVerificationToken, token), isNull(users.deletedAt)))
      .limit(1);

    const user = result[0];
    if (!user) {
      return { success: false, reason: 'invalid_token' };
    }

    if (user.emailVerified) {
      return { success: true, userId: user.id };
    }

    if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
      return { success: false, reason: 'token_expired' };
    }

    await this.db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, userId: user.id };
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0;
  }

  private toProfileInfo(
    user: Pick<
      User,
      | 'id'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'countryCode'
      | 'baseCurrencyCode'
      | 'onboardingCompleted'
      | 'role'
      | 'createdAt'
      | 'updatedAt'
    >,
  ): ProfileInfo {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      countryCode: user.countryCode,
      baseCurrencyCode: user.baseCurrencyCode,
      onboardingCompleted: user.onboardingCompleted,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toUserInfo(user: UserInfoRow): UserInfo {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
      countryCode: user.countryCode,
      baseCurrencyCode: user.baseCurrencyCode,
      onboardingCompleted: user.onboardingCompleted,
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
