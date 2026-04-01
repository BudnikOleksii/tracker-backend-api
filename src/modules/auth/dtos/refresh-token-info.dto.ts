import { ApiProperty } from '@nestjs/swagger';

import type { UserRole } from '@/shared/enums/role.enum.js';

class RefreshTokenUserDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User role', example: 'USER' })
  role: UserRole;
}

class RefreshTokenDetailDto {
  @ApiProperty({
    description: 'Refresh token session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Token expiration date', example: '2026-04-02T00:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({
    description: 'IP address that created the token',
    example: '192.168.1.1',
    type: String,
    nullable: true,
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'User agent that created the token',
    example: 'Mozilla/5.0',
    type: String,
    nullable: true,
  })
  userAgent: string | null;
}

export class RefreshTokenInfoDto {
  @ApiProperty({ description: 'User information', type: RefreshTokenUserDto })
  user: RefreshTokenUserDto;

  @ApiProperty({ description: 'Refresh token details', type: RefreshTokenDetailDto })
  refreshToken: RefreshTokenDetailDto;
}
