import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { Roles } from '@/shared/decorators/roles.decorator.js';
import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';

import { AuditLogService } from './audit-log.service.js';

export class AuditLogQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ example: 'POST /api/auth/login' })
  @IsOptional()
  @IsString()
  action?: string;
}

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'Query audit log list' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: AuditLogQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.auditLogService.findAll({
      page,
      pageSize,
      actorId: query.actorId,
      action: query.action,
    });

    const totalPages = Math.ceil(result.total / pageSize);

    return {
      object: 'list' as const,
      data: result.data,
      total: result.total,
      page,
      pageSize,
      hasMore: page < totalPages,
    };
  }
}
