import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class AssignRoleDto {
  @ApiProperty({ enum: ROLES, example: 'USER', enumName: 'UserRole' })
  @IsIn(ROLES)
  role!: UserRole;
}
