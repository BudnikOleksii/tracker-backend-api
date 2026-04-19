import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';

import { SORT_BY_FIELDS } from '../audit-log.constants.js';
import type { SortByField } from '../audit-log.constants.js';

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
    enumName: ENUM_NAMES.AUDIT_LOG_SORT_BY,
    description: 'Field to sort by (default: createdAt)',
  })
  @IsOptional()
  @IsIn(SORT_BY_FIELDS)
  sortBy?: SortByField;

  @ApiPropertyOptional({
    example: 'desc',
    type: String,
    enum: SORT_ORDERS,
    enumName: ENUM_NAMES.SORT_ORDER,
    description: 'Sort direction (default: desc)',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
