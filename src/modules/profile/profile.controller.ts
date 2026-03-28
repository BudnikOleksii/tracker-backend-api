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

import { JwtAuthGuard } from '@/shared/guards/index.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';

import { ChangePasswordDto } from './dtos/change-password.dto.js';
import { DeleteAccountDto } from './dtos/delete-account.dto.js';
import { ProfileResponseDto } from './dtos/profile-response.dto.js';
import { UpdateProfileDto } from './dtos/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req: { user: { id: string } }, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid current password' })
  async changePassword(@Request() req: { user: { id: string } }, @Body() dto: ChangePasswordDto) {
    await this.profileService.changePassword(req.user.id, dto);

    return { message: 'Password changed successfully' };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete account' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async deleteAccount(@Request() req: { user: { id: string } }, @Body() dto: DeleteAccountDto) {
    await this.profileService.deleteAccount(req.user.id, dto);

    return { message: 'Account deleted successfully' };
  }
}
