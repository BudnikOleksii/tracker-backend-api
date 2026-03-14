import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { OffsetPaginationDto } from '@/shared/dtos/pagination.dto.js';
import { ROLES, UserRole } from '@/shared/enums/role.enum.js';

export class UserQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'ADMIN', enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  role?: UserRole;
}
