import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { OnboardingService } from './onboarding.service.js';
import { CompleteOnboardingDto } from './dtos/complete-onboarding.dto.js';
import { OnboardingStatusResponseDto } from './dtos/onboarding-status-response.dto.js';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiResponse({ status: 200, type: OnboardingStatusResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Request() req: AuthenticatedRequest): Promise<OnboardingStatusResponseDto> {
    return this.onboardingService.getStatus(req.user.id);
  }

  @Post('complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete onboarding' })
  @ApiResponse({ status: 200, type: OnboardingStatusResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or missing requirements' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async complete(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CompleteOnboardingDto,
  ): Promise<OnboardingStatusResponseDto> {
    return this.onboardingService.complete(req.user.id, dto);
  }

  @Post('assign-default-categories')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign default transaction categories' })
  @ApiResponse({ status: 200, description: 'Default categories assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async assignDefaultCategories(@Request() req: AuthenticatedRequest): Promise<MessageResponseDto> {
    await this.onboardingService.assignDefaultCategories(req.user.id);

    return { message: 'Default categories assigned successfully' };
  }
}
