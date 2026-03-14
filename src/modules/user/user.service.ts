import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { hasRequiredRole } from '@/shared/enums/role.enum.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';
import type { User } from '@/database/schemas/users.js';

import { UserRepository } from './user.repository.js';
import type { UserInfo, UserListQuery, UserListResult, UserSummary } from './user.repository.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findAll(query: UserListQuery): Promise<UserListResult> {
    return this.userRepository.findAll(query);
  }

  async findById(id: string): Promise<UserInfo> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${id} not found`,
      });
    }

    return user;
  }

  async create(data: { email: string; password: string; role?: UserRole }): Promise<UserInfo> {
    const exists = await this.userRepository.existsByEmail(data.email);
    if (exists) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_EXISTS,
        message: 'This email address is already in use',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    return this.userRepository.create({
      email: data.email,
      passwordHash,
      role: data.role,
    });
  }

  async update(id: string, data: { role?: UserRole }): Promise<UserInfo> {
    const updated = await this.userRepository.update(id, data);
    if (!updated) {
      throw new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: `User ${id} not found`,
      });
    }

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
  }

  async getSummary(): Promise<UserSummary> {
    return this.userRepository.getSummary();
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

    return updated;
  }
}
