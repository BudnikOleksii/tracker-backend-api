import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { IsStringField } from '@/shared/decorators/validators.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'USER', enum: ROLES, enumName: ENUM_NAMES.USER_ROLE })
  @IsOptional()
  @IsStringField()
  @IsIn(ROLES)
  role?: UserRole;
}
