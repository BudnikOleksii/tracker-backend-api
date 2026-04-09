import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

import { BCRYPT_ROUNDS } from '@/shared/constants/auth.constants.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';

import { UserRepository } from '../user/user.repository.js';
import type { ProfileInfo, UpdateProfileData } from '../user/user.repository.js';
import type { ChangePasswordDto } from './dtos/change-password.dto.js';
import type { DeleteAccountDto } from './dtos/delete-account.dto.js';
import { PROFILE_EVENTS, ProfileSessionInvalidationEvent } from './events/profile.event.js';

const CACHE_MODULE = 'users';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string): Promise<ProfileInfo> {
    const profile = await this.userRepository.findProfileById(userId);

    if (!profile) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
      });
    }

    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileInfo> {
    const updated = await this.userRepository.updateProfile(userId, data);

    if (!updated) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'User not found',
      });
    }

    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    return updated;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    accessTokenJti: string,
  ): Promise<void> {
    const user = await this.userRepository.findWithPasswordHash(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found',
      });
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'This account uses social login and has no password to change',
      });
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Current password is incorrect',
      });
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userRepository.updatePasswordHash(userId, newHash);

    await this.eventEmitter.emitAsync(
      PROFILE_EVENTS.PASSWORD_CHANGED,
      new ProfileSessionInvalidationEvent(userId, accessTokenJti),
    );
  }

  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
    accessTokenJti: string,
  ): Promise<void> {
    const user = await this.userRepository.findWithPasswordHash(userId);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found',
      });
    }

    if (user.passwordHash) {
      if (!dto.password) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_CREDENTIALS,
          message: 'Password is required to delete this account',
        });
      }
      const isValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_CREDENTIALS,
          message: 'Password is incorrect',
        });
      }
    }

    await this.userRepository.softDelete(userId);
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));

    await this.eventEmitter.emitAsync(
      PROFILE_EVENTS.ACCOUNT_DELETED,
      new ProfileSessionInvalidationEvent(userId, accessTokenJti),
    );
  }
}
