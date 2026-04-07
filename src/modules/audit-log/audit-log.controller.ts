import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { Roles } from '@/shared/decorators/roles.decorator.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';
import { buildPaginatedResponse } from '@/shared/utils/pagination.utils.js';

import { SORT_BY_FIELDS } from './audit-log.constants.js';
import type { SortByField } from './audit-log.constants.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogListResponseDto } from './dtos/audit-log-list-response.dto.js';

export class AuditLogQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ example: 'POST /api/auth/login' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: 'AuditLogSortBy',
    description: 'Field to sort by (default: createdAt)',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: SortByField;

  @ApiPropertyOptional({
    example: 'desc',
    type: String,
    enum: SORT_ORDERS,
    enumName: 'SortOrder',
    description: 'Sort direction (default: desc)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit log list' })
  @ApiResponse({ status: 200, type: AuditLogListResponseDto })
  async findAll(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.findAll({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      actorId: query.actorId,
      action: query.action,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResponse(query, result);
  }
}
