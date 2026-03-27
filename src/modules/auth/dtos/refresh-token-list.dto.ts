import { ApiProperty } from '@nestjs/swagger';

class RefreshTokenItemDto {
  @ApiProperty({
    description: 'Refresh token session ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

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

  @ApiProperty({ description: 'When the token was created', example: '2026-03-26T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'When the token expires', example: '2026-04-02T00:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether this is the current session token', example: true })
  isCurrent: boolean;
}

export class RefreshTokenListDto {
  @ApiProperty({ description: 'List of active refresh tokens', type: [RefreshTokenItemDto] })
  refreshTokens: RefreshTokenItemDto[];
}
