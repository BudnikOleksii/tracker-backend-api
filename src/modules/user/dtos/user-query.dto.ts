import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { SORT_ORDERS } from '@/shared/constants/sort.constants.js';
import type { SortOrder } from '@/shared/constants/sort.constants.js';
import { IsInField, IsStringField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { SORT_BY_FIELDS } from '../user.constants.js';
import type { SortByField } from '../user.constants.js';

export class UserQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsStringField()
  search?: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: ROLES, enumName: ENUM_NAMES.USER_ROLE })
  @IsOptional()
  @IsInField([...ROLES])
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'createdAt',
    type: String,
    enum: SORT_BY_FIELDS,
    enumName: ENUM_NAMES.USER_SORT_BY,
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
