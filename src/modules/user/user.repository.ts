import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, ilike, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { users } from '@/database/schemas/index.js';
import { DB_TOKEN } from '@/database/types.js';
import type { DrizzleDb } from '@/database/types.js';
import type { User } from '@/database/schemas/index.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import type { CountryCode } from '@/shared/enums/country-code.enum.js';
import type { CurrencyCode } from '@/shared/enums/currency-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';
import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';

import type { SortByField } from './user.constants.js';

export interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
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
  authProvider?: AuthProvider;
  authProviderId?: string;
  emailVerified?: boolean;
}

export interface UpdateUserData {
  role?: UserRole;
}

export interface UserSummary {
  total: number;
  adminCount: number;
  newToday: number;
}

const SORT_COLUMN_MAP = {
  email: users.email,
  createdAt: users.createdAt,
} as const;

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findAll(query: UserListQuery): Promise<UserListResult> {
    const { page, pageSize, search, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const conditions: SQL[] = [];
    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (search) {
      conditions.push(ilike(users.email, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const sortDirection = sortOrder === 'asc' ? asc : desc;

    const [usersData, totalResult] = await Promise.all([
      this.db
        .select()
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
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toUserInfo(result[0] as User);
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
      .where(eq(users.email, email.toLowerCase()));

    return (result[0]?.count ?? 0) > 0;
  }

  async create(data: CreateUserData): Promise<UserInfo> {
    const [user] = await this.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash ?? null,
        role: data.role ?? 'USER',
        firstName: data.firstName,
        lastName: data.lastName,
        authProvider: data.authProvider ?? 'LOCAL',
        authProviderId: data.authProviderId,
        emailVerified: data.emailVerified ?? false,
      })
      .returning();

    return this.toUserInfo(user as User);
  }

  async update(id: string, data: UpdateUserData): Promise<UserInfo | null> {
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (data.role !== undefined) {
      updates.role = data.role;
    }

    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();

    if (result.length === 0) {
      return null;
    }

    return this.toUserInfo(result[0] as User);
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

  async findFullById(id: string): Promise<{
    id: string;
    email: string;
    emailVerified: boolean;
    passwordHash: string | null;
    baseCurrencyCode: string | null;
    onboardingCompleted: boolean;
  }> {
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
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toProfileInfo(result[0] as User);
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

    if (result.length === 0) {
      return null;
    }

    return this.toProfileInfo(result[0] as User);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async findByAuthProvider(
    authProvider: AuthProvider,
    authProviderId: string,
  ): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.authProvider, authProvider),
          eq(users.authProviderId, authProviderId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async linkSocialAccount(
    id: string,
    authProvider: AuthProvider,
    authProviderId: string,
  ): Promise<void> {
    await this.db
      .update(users)
      .set({ authProvider, authProviderId, updatedAt: new Date() })
      .where(eq(users.id, id));
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

  private toProfileInfo(user: User): ProfileInfo {
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

  private toUserInfo(user: User): UserInfo {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
