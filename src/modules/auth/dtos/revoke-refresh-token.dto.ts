import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmptyField, IsUUIDField } from '@/shared/decorators/validators.js';

export class RevokeRefreshTokenDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUIDField()
  @IsNotEmptyField()
  sessionId: string;
}
