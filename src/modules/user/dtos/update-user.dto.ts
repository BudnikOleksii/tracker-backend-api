import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsStringField } from '@/shared/decorators/validators.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'USER', enum: ROLES, enumName: 'UserRole' })
  @IsOptional()
  @IsStringField()
  @IsIn(ROLES)
  role?: UserRole;
}
