import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { AuthService } from '@/modules/auth/auth.service.js';
import { buildCachePrefix } from '@/modules/cache/cache-key.utils.js';
import { CacheService } from '@/modules/cache/cache.service.js';

import { UserRepository } from '../user/user.repository.js';
import type { ProfileInfo, UpdateProfileData } from '../user/user.repository.js';
import type { ChangePasswordDto } from './dtos/change-password.dto.js';
import type { DeleteAccountDto } from './dtos/delete-account.dto.js';

const BCRYPT_ROUNDS = 12;
const CACHE_MODULE = 'users';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly cacheService: CacheService,
  ) {}

  async getProfile(userId: string): Promise<ProfileInfo> {
    const profile = await this.userRepository.findProfileById(userId);

    if (!profile) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found',
      });
    }

    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileInfo> {
    const updated = await this.userRepository.updateProfile(userId, data);

    if (!updated) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
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

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Current password is incorrect',
      });
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userRepository.updatePasswordHash(userId, newHash);
    await this.authService.revokeAllRefreshTokens(userId);
    await this.authService.blacklistAccessToken(accessTokenJti);
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

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Password is incorrect',
      });
    }

    await this.userRepository.softDelete(userId);
    await this.authService.revokeAllRefreshTokens(userId);
    await this.authService.blacklistAccessToken(accessTokenJti);
    await this.cacheService.delByPrefix(buildCachePrefix(CACHE_MODULE));
  }
}
