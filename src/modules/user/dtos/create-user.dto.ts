import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import {
  IsEmailField,
  IsInField,
  IsNotEmptyField,
  IsStringField,
  MatchesField,
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
  @IsNotEmptyField({ message: 'Password must not be empty' })
  @MinLengthField(8, { message: 'Password must be at least 8 characters long' })
  @MaxLengthField(100, { message: 'Password must not exceed 100 characters' })
  @MatchesField(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one digit',
  })
  password: string;

  @ApiPropertyOptional({ example: 'USER', enum: ROLES, enumName: 'UserRole' })
  @IsOptional()
  @IsInField(ROLES)
  role?: UserRole;
}
