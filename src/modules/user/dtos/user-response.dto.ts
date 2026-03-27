import { ApiProperty } from '@nestjs/swagger';

import { ROLES } from '@/shared/enums/role.enum.js';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ROLES,
    enumName: 'UserRole',
  })
  role: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-03-15T10:30:00.000Z' })
  updatedAt: Date;
}
