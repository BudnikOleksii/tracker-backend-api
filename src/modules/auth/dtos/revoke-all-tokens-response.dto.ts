import { ApiProperty } from '@nestjs/swagger';

export class RevokeAllTokensResponseDto {
  @ApiProperty({ description: 'Number of refresh tokens that were revoked', example: 3 })
  revokedCount: number;

  @ApiProperty({
    description: 'Human-readable result message',
    example: 'All refresh tokens revoked successfully. Total: 3',
  })
  message: string;
}
