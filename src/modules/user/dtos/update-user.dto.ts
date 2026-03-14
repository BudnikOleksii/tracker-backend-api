import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { IsStringField } from '@/shared/decorators/validators.js';
import { ROLES, UserRole } from '@/shared/enums/role.enum.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'USER', enum: ROLES })
  @IsOptional()
  @IsStringField()
  @IsIn(ROLES)
  role?: UserRole;
}
