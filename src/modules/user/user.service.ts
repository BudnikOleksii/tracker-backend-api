import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { User } from '@/database/schemas/users.js';
import { buildCacheKey, buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';
import { BCRYPT_ROUNDS } from '@/shared/constants/auth.constants.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { hasRequiredRole } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { UserRepository } from './user.repository.js';
import type { UserInfo, UserListQuery, UserListResult, UserSummary } from './user.repository.js';
const CACHE_MODULE = 'users';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
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
}
