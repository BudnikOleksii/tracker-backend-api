import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class AssignRoleDto {
  @ApiProperty({ enum: ROLES, example: 'USER', enumName: ENUM_NAMES.USER_ROLE })
  @IsIn(ROLES)
  role!: UserRole;
}
