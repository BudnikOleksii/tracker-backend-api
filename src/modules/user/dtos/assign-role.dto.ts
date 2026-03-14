import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ROLES } from '@/shared/enums/role.enum.js';
import type { RoleType } from '@/shared/enums/role.enum.js';

export class AssignRoleDto {
  @ApiProperty({ enum: Object.values(ROLES), example: 'USER' })
  @IsIn(Object.values(ROLES))
  role!: RoleType;
}
