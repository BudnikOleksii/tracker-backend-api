import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { DeleteAccountDto } from './dtos/delete-account.dto.js';
import { ProfileResponseDto } from './dtos/profile-response.dto.js';
import { UpdateProfileDto } from './dtos/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    await this.profileService.changePassword(req.user.id, dto, req.user.jti);

    return { message: 'Password changed successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  async deleteAccount(
    @Request() req: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ): Promise<MessageResponseDto> {
    await this.profileService.deleteAccount(req.user.id, dto, req.user.jti);

    return { message: 'Account deleted successfully' };
  }
}
