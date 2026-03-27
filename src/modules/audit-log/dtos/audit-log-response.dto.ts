import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'Audit log entry ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Action performed', example: 'POST /api/auth/login' })
  action: string;

  @ApiProperty({
    description: 'Actor user ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
    nullable: true,
  })
  actorId: string | null;

  @ApiProperty({
    description: 'Actor email address',
    example: 'admin@example.com',
    type: String,
    nullable: true,
  })
  actorEmail: string | null;

  @ApiProperty({
    description: 'Resource type affected',
    example: 'user',
    type: String,
    nullable: true,
  })
  resourceType: string | null;

  @ApiProperty({
    description: 'Resource ID affected',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
    nullable: true,
  })
  resourceId: string | null;

  @ApiProperty({
    description: 'Additional details',
    example: { reason: 'Role change' },
    type: Object,
    nullable: true,
  })
  detail: unknown;

  @ApiProperty({
    description: 'Client IP address',
    example: '192.168.1.1',
    type: String,
    nullable: true,
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'Client user agent',
    example: 'Mozilla/5.0...',
    type: String,
    nullable: true,
  })
  userAgent: string | null;

  @ApiProperty({
    description: 'Request ID',
    example: 'req-abc123',
    type: String,
    nullable: true,
  })
  requestId: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-03-15T10:30:00.000Z' })
  createdAt: Date;
}
