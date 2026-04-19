import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import type { User } from '@/database/schemas/users.js';
import type { UserAuthIdentity } from '@/database/schemas/user-auth-identities.js';
import type { AuthProvider } from '@/shared/enums/auth-provider.enum.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { BCRYPT_ROUNDS } from '@/shared/constants/auth.constants.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { hasRequiredRole } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { USER_EVENTS, UserHardDeletedEvent } from './events/user.event.js';
import { IdentityRepository } from './identity.repository.js';
import type { IdentityWithUser } from './identity.repository.js';
import { UserRepository } from './user.repository.js';
import type {
  ProfileInfo,
  UpdateProfileData,
  UserInfo,
  UserListQuery,
  UserListResult,
  UserSummary,
} from './user.repository.js';

const CACHE_MODULE = 'users';

@Injectable()
export class UserService {
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(
    private readonly userRepository: UserRepository,
    private readonly identityRepository: IdentityRepository,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByAuthProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<IdentityWithUser | null> {
    return this.identityRepository.findByProvider(provider, providerId);
  }

  async linkIdentity(params: {
    userId: string;
    provider: AuthProvider;
    providerId: string;
    emailAtLink?: string;
  }): Promise<UserAuthIdentity> {
    const created = await this.identityRepository.create({
      userId: params.userId,
      provider: params.provider,
      providerId: params.providerId,
      emailAtLink: params.emailAtLink,
    });
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return created;
  }

  async hasLocalIdentity(userId: string): Promise<boolean> {
    return this.identityRepository.hasLocalIdentity(userId);
  }

  async createSocialUser(data: {
    email: string;
    authProvider: AuthProvider;
    authProviderId: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserInfo> {
    // The unique constraint on (email) and the partial unique on (provider, providerId)
    // are the authoritative guards. Callers must handle `isUniqueViolation` to cover
    // the race window that a pre-check could never fully close.
    const result = await this.userRepository.create({
      email: data.email,
      passwordHash: null,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: true,
      identity: {
        provider: data.authProvider,
        providerId: data.authProviderId,
        emailAtLink: data.email,
      },
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return result;
  }

  async findAll(query: UserListQuery): Promise<UserListResult> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: 'admin',
      operation: 'list',
      params: query,
    });

    return this.cacheService.wrap(key, () => this.userRepository.findAll(query));
  }

  async findById(id: string): Promise<UserInfo> {
    const key = buildCacheKey({
      module: CACHE_MODULE,
      userId: 'admin',
      operation: 'detail',
      params: { id },
    });
    const user = await this.cacheService.wrap(key, () => this.userRepository.findById(id));

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${id} not found`,
      });
    }

    return user;
  }

  async create(data: {
    email: string;
    password: string;
    role?: UserRole;
    firstName?: string;
    lastName?: string;
  }): Promise<UserInfo> {
    const exists = await this.userRepository.existsByEmail(data.email);
    if (exists) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_EXISTS,
        message: 'This email address is already in use',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const result = await this.userRepository.create({
      email: data.email,
      passwordHash,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      identity: {
        provider: 'LOCAL',
        providerId: null,
        emailAtLink: data.email,
      },
    });

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return result;
  }

  async update(id: string, data: { role?: UserRole }): Promise<UserInfo> {
    const updated = await this.userRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${id} not found`,
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.userRepository.hardDelete(id);
    if (!deleted) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${id} not found`,
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    await this.eventEmitter.emitAsync(USER_EVENTS.HARD_DELETED, new UserHardDeletedEvent(id));
  }

  async getSummary(): Promise<UserSummary> {
    const key = buildCacheKey({ module: CACHE_MODULE, userId: 'admin', operation: 'summary' });

    return this.cacheService.wrap(key, () => this.userRepository.getSummary());
  }

  // eslint-disable-next-line @typescript-eslint/max-params
  async assignRole(
    targetUserId: string,
    newRole: UserRole,
    actorId: string,
    actorRole: UserRole,
  ): Promise<UserInfo> {
    if (actorId === targetUserId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Modifying your own role is not allowed',
      });
    }

    if (!hasRequiredRole(actorRole, 'ADMIN')) {
      throw new ForbiddenException({
        code: ErrorCode.INSUFFICIENT_SCOPE,
        message: 'Insufficient permissions',
      });
    }

    const updated = await this.userRepository.update(targetUserId, { role: newRole });
    if (!updated) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${targetUserId} not found`,
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return updated;
  }

  async findProfileById(userId: string): Promise<ProfileInfo | null> {
    return this.userRepository.findProfileById(userId);
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileInfo | null> {
    const updated = await this.userRepository.updateProfile(userId, data);

    if (updated) {
      await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));
    }

    return updated;
  }

  async findWithPasswordHash(
    userId: string,
  ): Promise<{ id: string; passwordHash: string | null } | null> {
    return this.userRepository.findWithPasswordHash(userId);
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.updatePasswordHashWithLocalIdentity(userId, passwordHash);
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));
  }

  async softDelete(userId: string): Promise<boolean> {
    const deleted = await this.userRepository.softDelete(userId);

    if (deleted) {
      await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));
    }

    return deleted;
  }

  async setEmailVerificationToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.userRepository.setEmailVerificationToken(userId, token, expiresAt);
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: true; userId: string } | { success: false; reason: string }> {
    return this.userRepository.verifyEmail(token);
  }

  async findFullById(userId: string) {
    return this.userRepository.findFullById(userId);
  }
}
