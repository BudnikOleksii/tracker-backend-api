import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsEmailField,
  IsInField,
  IsStringField,
  MaxLengthField,
  MinLengthField,
} from '@/shared/decorators/validators.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsStringField()
  @MinLengthField(1)
  @MaxLengthField(50)
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmailField()
  email: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsStringField()
  @MinLengthField(6)
  password: string;

  @ApiPropertyOptional({ example: 'USER', enum: ROLES, enumName: 'UserRole' })
  @IsOptional()
  @IsInField(ROLES)
  role?: UserRole;
}
