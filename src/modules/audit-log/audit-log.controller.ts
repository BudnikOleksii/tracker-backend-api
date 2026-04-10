import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/shared/decorators/roles.decorator.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';
import { buildPaginatedResponse } from '@/shared/utils/pagination.utils.js';

import { AuditLogService } from './audit-log.service.js';
import { AuditLogListResponseDto } from './dtos/audit-log-list-response.dto.js';
import { AuditLogQueryDto } from './dtos/audit-log-query.dto.js';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden' })
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit log list' })
  @ApiResponse({ status: 200, type: AuditLogListResponseDto })
  async findAll(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.findAll({
      page: query.page,
      pageSize: query.pageSize,
      actorId: query.actorId,
      action: query.action,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResponse(query, result);
  }
}
