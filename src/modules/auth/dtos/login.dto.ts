import { ApiProperty } from '@nestjs/swagger';

import { IsEmailField, IsNotEmptyField, IsStringField } from '@/shared/decorators/validators.js';
import { ENUM_NAMES } from '@/shared/constants/enum-name.constants.js';
import { ROLES } from '@/shared/enums/role.enum.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmailField({ message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'Pass123456' })
  @IsStringField()
  @IsNotEmptyField({ message: 'Password must not be empty' })
  password: string;
}

export class AuthUserDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    type: String,
    enum: ROLES,
    enumName: ENUM_NAMES.USER_ROLE,
  })
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiJ9...' })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
