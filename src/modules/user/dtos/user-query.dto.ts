import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { IsInField, IsStringField } from '@/shared/decorators/validators.js';
import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class UserQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsStringField()
  search?: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: ROLES, enumName: 'UserRole' })
  @IsOptional()
  @IsInField([...ROLES])
  role?: UserRole;
}
